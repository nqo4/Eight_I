import { expect, test } from "./fixtures";
import { spawnSync } from "node:child_process";
import path from "node:path";

// Run the actual modules in an isolated process so these checks cannot use a shared DB.
function withoutDatabase(source: string) {
  const env = { ...process.env };
  delete env.DATABASE_URL;
  delete env.POSTGRES_URL;
  delete env.POSTGRES_PRISMA_URL;
  const result = spawnSync(process.execPath, ["--import", "tsx", "-e", source], {
    cwd: path.resolve(__dirname, "../.."),
    env,
    encoding: "utf8",
    timeout: 20_000,
  });
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout.trim());
}

test("로그인과 저장 실패: no database cannot report successful persistence", () => {
  const result = withoutDatabase(`
    const h = require('./src/server/history.ts');
    const { handle } = require('./src/server/http.ts');
    const quiz = { feature_id: 'f', questions: [{id:'q', choices:['a','b'], answer_index:0}] };
    Promise.all([
      handle(() => h.recordQuizAttempt({userId:'u', analysisId:'a', quiz, questionId:'q', chosenIndex:0})),
      handle(() => h.recordMissionScore({userId:'u', analysisId:'a', featureId:'f', score:40, passed:false}))
    ]).then(async responses => console.log(JSON.stringify(await Promise.all(responses.map(async r => ({status:r.status, body:await r.json()}))))));
  `);
  for (const response of result) {
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("auth_unavailable");
    expect(response.body.saved).toBeUndefined();
  }
});

test("로그인과 저장 실패: authentication precedes malformed body and missing analysis", () => {
  const result = withoutDatabase(`
    const { POST } = require('./src/app/api/analyses/[analysisId]/features/[featureId]/quiz/attempts/route.ts');
    POST(new Request('http://localhost/api/quiz', {method:'POST', body:'not-json'}),
      {params:Promise.resolve({analysisId:'missing',featureId:'missing'})})
      .then(async r => console.log(JSON.stringify({status:r.status,body:await r.json()})));
  `);
  expect(result.status).toBe(401);
  expect(result.body.error.code).toBe("login_required");
});

test("로그인과 저장 실패: invalid answer indices are rejected", () => {
  const result = withoutDatabase(`
    const { recordQuizAttempt } = require('./src/server/history.ts');
    const quiz = {feature_id:'f',questions:[{id:'q',choices:['a','b'],answer_index:0}]};
    Promise.all([-1, 2, 0.5, NaN].map(chosenIndex =>
      recordQuizAttempt({userId:'u',analysisId:'a',quiz,questionId:'q',chosenIndex})
        .then(() => 'unexpected-success', e => e.code)
    )).then(x => console.log(JSON.stringify(x)));
  `);
  expect(result).toEqual(Array(4).fill("invalid_request"));
});

test("첫 답 최고점 분석 날짜: tied attempts and user dates survive scoring", async ({ sql, ownedId }) => {
  const { linkUserRepository, listLearningRecords, listQuizAttempts, recordMissionScore } = await import("../../src/server/history");
  const users = await sql<{ id: string }>(
    "INSERT INTO users (name, username, password_hash) VALUES ('Fixture', $1, 'unused'), ('Fixture', $2, 'unused') RETURNING id",
    [ownedId + "_a", ownedId + "_b"],
  );
  await sql("INSERT INTO repositories (id,url,owner,name,default_branch,last_commit_sha) VALUES ($1,'https://github.com/fixture/repo','fixture','repo','main','sha')", [ownedId]);
  await sql("INSERT INTO analyses (id,repo_id,commit_sha,analysis,snapshot) VALUES ($1,$1,'sha',$2,'{}')", [ownedId, { features: [{ id: "f", title: "Feature" }] }]);
  for (let i = 0; i < users.length; i++) {
    await linkUserRepository(users[i].id, ownedId, ownedId);
    await sql("UPDATE user_repositories SET last_viewed_at=$1 WHERE user_id=$2 AND repo_id=$3", [`2026-10-0${i + 1}T00:00:00Z`, users[i].id, ownedId]);
  }
  await sql(`INSERT INTO quiz_attempts (user_id,analysis_id,feature_id,question_id,chosen_index,is_correct,created_at)
    VALUES ($1,$2,'f','q',1,false,'2026-10-03'),($1,$2,'f','q',0,true,'2026-10-03')`, [users[0].id, ownedId]);
  await recordMissionScore({ userId: users[0].id, analysisId: ownedId, featureId: "f", score: 80, passed: true });
  await recordMissionScore({ userId: users[0].id, analysisId: ownedId, featureId: "f", score: 40, passed: false });
  await sql("UPDATE quiz_attempts SET created_at='2026-10-03' WHERE user_id=$1 AND analysis_id=$2 AND kind='mission'", [users[0].id, ownedId]);
  const [first] = await listLearningRecords(users[0].id);
  expect(first.quiz_correct).toBe(0);
  expect(first.quiz_total).toBe(1);
  expect(first.features[0]).toMatchObject({ mission_best_score: 80, mission_last_score: 40, mission_graded: 2 });
  expect(new Date(first.analyzed_at).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  expect((await listQuizAttempts(users[0].id, ownedId, "f")).map(x => x.chosen_index)).toEqual([1, 0]);
  const [before] = await sql<{ time: string }>("SELECT clock_timestamp() AS time", []);
  await linkUserRepository(users[0].id, ownedId, ownedId);
  const [updated] = await listLearningRecords(users[0].id);
  const [after] = await sql<{ time: string }>("SELECT clock_timestamp() AS time", []);
  expect(new Date(updated.analyzed_at).getTime()).toBeGreaterThanOrEqual(new Date(before.time).getTime());
  expect(new Date(updated.analyzed_at).getTime()).toBeLessThanOrEqual(new Date(after.time).getTime());
  const [other] = await listLearningRecords(users[1].id);
  expect(new Date(other.analyzed_at).toISOString()).toBe("2026-10-02T00:00:00.000Z");
});

test("로그인과 저장 실패: actual INSERT failure stays an error", async ({ sql, ownedId }) => {
  const { recordMissionScore } = await import("../../src/server/history");
  const { handle } = await import("../../src/server/http");
  const users = await sql<{ id: string }>("INSERT INTO users (name,username,password_hash) VALUES ('Fixture',$1,'unused') RETURNING id", [ownedId]);
  const response = await handle(async () => {
    await recordMissionScore({ userId: users[0].id, analysisId: ownedId + "_missing", featureId: "f", score: 40, passed: false });
    return Response.json({ unexpected: true });
  });
  expect(response.status).toBe(500);
  expect((await response.json()).error.code).toBe("internal_error");
});
