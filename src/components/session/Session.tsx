"use client";

// 화면 사이에서 유지되는 학습 상태(분석 결과, 고른 기능, 진행 기록).
// 루트 layout에 있어서 Link·router.push로 이동해도 사라지지 않는다.
// /demo/* 를 새로 열거나 새로고침하면 마지막으로 연 분석 결과와 기능을 다시 연다(없으면 홈에서 분석하도록 안내).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getAuthEpoch, useCurrentUser } from "@/lib/auth";
import type { Analysis, Exercise, Feature, Flow } from "@/server/types";

// code는 서버 오류 코드(src/server/errors.ts). 'login_required'면 화면에 '로그인하기'를 함께 보여 준다.
export type ApiError = { message: string; retryable: boolean; code?: string };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { cache: "no-store", ...init });
  } catch {
    throw { message: "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.", retryable: true } satisfies ApiError;
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw (body?.error ?? { message: "요청을 처리하지 못했어요.", retryable: true }) as ApiError;
  return body as T;
}

export type StepKey = "overview" | "flow" | "concept" | "quiz" | "mission";

export type Progress = {
  quiz: Record<string, boolean>; // 연습 문제 첫 시도: 문제 id → 맞힘
  // 실제로 끝낸 단계. 화면 위치와 따로 기록해 '미션만 열었는데 50% 완료' 같은 표시를 막는다.
  steps: Partial<Record<StepKey, boolean>>;
  flowView?: { open: number; revealed: number };
  quizView?: { picked: Record<string, number>; checked: Record<string, boolean> };
};
const emptyProgress: Progress = { quiz: {}, steps: {} };

// 화면 진행 상태는 로그인한 계정·저장소·커밋별로 브라우저에 남긴다(같은 브라우저에서 계정을 바꿔도 섞이지 않게, FR-10·FR-13).
// 퀴즈·미션 결과는 서버의 '내 학습 기록'(FR-13)에도 남는다. 계정 정보가 없는 예전 키는 읽지 않는다.
export const LOCAL_PREFIX = "codeback:v1:";
const lastKey = (owner: string) => `${LOCAL_PREFIX}last:${owner}`;
const progressKey = (owner: string, a: Analysis) =>
  `${LOCAL_PREFIX}progress:${owner}:${a.repository.id}@${a.repository.commit_sha}`;

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 막혀 있어도 학습은 계속할 수 있어야 한다.
  }
}

type Session = {
  isCurrent: () => boolean;
  analysis: Analysis | null;
  feature: Feature | null;
  setAnalysis: (a: Analysis) => void;
  selectFeature: (f: Feature) => void;
  // FR-14: '사용한 기술'에서 고른 기술 이름
  techName: string | null;
  selectTech: (name: string) => void;
  progress: Progress;
  record: (update: (p: Progress) => Progress) => void;
  // 카드에 쓰려고 이미 받은 흐름·미션을 기억한다(다시 요청하지 않음).
  cache: { flow?: Flow; exercise?: Exercise };
  remember: (part: { flow?: Flow; exercise?: Exercise }) => void;
  ensure: () => Promise<void>;
  loadError: ApiError | null;
};

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const epoch = getAuthEpoch();
  const owner = user === undefined ? undefined : (user?.email ?? null);
  return <OwnedSession key={epoch} owner={owner} epoch={epoch}>{children}</OwnedSession>;
}

function OwnedSession({ children, owner, epoch }: { children: ReactNode; owner: string | null | undefined; epoch: number }) {
  const [analysis, setAnalysisState] = useState<Analysis | null>(null);
  const [feature, setFeature] = useState<Feature | null>(null);
  const [progressByFeature, setProgress] = useState<Record<string, Progress>>({});
  const [cacheByFeature, setCache] = useState<Record<string, { flow?: Flow; exercise?: Exercise }>>({});
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [techName, setTechName] = useState<string | null>(null);
  const activeAnalysis = useRef<Analysis | null>(null);
  const isCurrent = useCallback(() => getAuthEpoch() === epoch, [epoch]);

  const setAnalysis = useCallback(
    (a: Analysis) => {
      if (!isCurrent() || !owner) return;
      activeAnalysis.current = a;
      setAnalysisState(a);
      setFeature(null);
      setProgress(readJson<Record<string, Progress>>(progressKey(owner, a)) ?? {});
      setCache({});
      setLoadError(null);
    },
    [isCurrent, owner],
  );

  const ensure = useCallback(async () => {
    if (!isCurrent()) return;
    if (analysis) {
      if (!feature && analysis.features[0]) setFeature(analysis.features[0]);
      return;
    }
    // 로그인 확인이 끝난 뒤에 그 계정의 마지막 분석을 연다.
    if (owner === undefined) return;
    if (owner === null) {
      setLoadError({ message: "로그인하면 분석 결과를 볼 수 있어요.", retryable: false, code: "login_required" });
      return;
    }
    setLoadError(null);
    const last = readJson<{ analysisId: string; featureId: string | null; repo?: string }>(lastKey(owner));
    let a: Analysis | null = null;
    if (last?.analysisId) {
      let failed: ApiError | null = null;
      a = await api<{ analysis: Analysis }>(`/api/analyses/${encodeURIComponent(last.analysisId)}`)
        .then((r) => r.analysis)
        .catch((e: ApiError) => ((failed = e), null));
      if (!isCurrent() || activeAnalysis.current) return;
      // 로그인이 풀려 못 불러온 경우는 '다시 분석' 대신 로그인하라고 안내한다.
      if (!a && (failed as ApiError | null)?.code === "login_required") {
        setLoadError(failed);
        return;
      }
    }
    if (!a) {
      setLoadError({
        message: last?.repo
          ? `이전에 분석한 저장소(${last.repo})를 다시 불러오지 못했어요. 홈에서 다시 분석하거나 '내 학습 기록'에서 열어 주세요.`
          : "아직 연 분석 결과가 없어요. 홈에서 내 저장소를 분석해 주세요.",
        retryable: false,
      });
      return;
    }
    activeAnalysis.current = a;
    setAnalysisState(a);
    setProgress(readJson<Record<string, Progress>>(progressKey(owner, a)) ?? {});
    setFeature(a.features.find((f) => f.id === last?.featureId) ?? a.features[0] ?? null);
  }, [analysis, feature, owner, isCurrent]);

  // 상태를 불러온 계정과 지금 계정이 같을 때만 저장한다(다른 계정 키에 덮어쓰지 않게).
  useEffect(() => {
    if (!analysis || !owner || !isCurrent()) return;
    writeJson(lastKey(owner), { analysisId: analysis.id, featureId: feature?.id ?? null, repo: analysis.repository.id });
    writeJson(progressKey(owner, analysis), progressByFeature);
  }, [analysis, feature, progressByFeature, owner, isCurrent]);

  const fid = feature?.id ?? "";
  const value: Session = {
    isCurrent,
    analysis,
    feature,
    setAnalysis,
    selectFeature: (f) => {
      if (!isCurrent() || activeAnalysis.current !== analysis) return;
      setFeature(f);
      setProgress((all) => ({ ...all, [f.id]: { ...(all[f.id] ?? emptyProgress), steps: { ...all[f.id]?.steps, overview: true } } }));
    },
    techName,
    selectTech: (name) => { if (isCurrent()) setTechName(name); },
    progress: { ...emptyProgress, ...progressByFeature[fid] },
    record: (update) => {
      if (!isCurrent() || activeAnalysis.current !== analysis) return;
      setProgress((all) => ({ ...all, [fid]: update({ ...emptyProgress, ...all[fid] }) }));
    },
    cache: cacheByFeature[fid] ?? {},
    remember: (part) => {
      if (!isCurrent() || activeAnalysis.current !== analysis) return;
      setCache((all) => ({ ...all, [fid]: { ...all[fid], ...part } }));
    },
    ensure,
    loadError,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error("SessionProvider가 없습니다");
  return s;
}

// 학습 화면에서 쓰는 훅: 분석·기능이 없으면 마지막 분석을 다시 열고, 기능별 자료를 한 번 불러온다.
export function useFeatureResource<T>(kind: "flow" | "lesson" | "quiz" | "exercise") {
  const { analysis, feature, ensure, loadError, isCurrent } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data: T | null; error: ApiError | null } | null>(null);
  const path =
    analysis && feature
      ? `/api/analyses/${encodeURIComponent(analysis.id)}/features/${encodeURIComponent(feature.id)}/${kind}`
      : null;
  const key = `${getAuthEpoch()}:${path}#${attempt}`;

  useEffect(() => {
    if (!path) {
      ensure();
      return;
    }
    let alive = true;
    api<T>(path)
      .then((d) => alive && isCurrent() && setResult({ key, data: d, error: null }))
      .catch((e) => alive && isCurrent() && setResult({ key, data: null, error: e as ApiError }));
    return () => {
      alive = false;
    };
  }, [path, key, ensure, isCurrent]);

  const current = result?.key === key ? result : null;
  return {
    data: current?.data ?? null,
    error: loadError ?? current?.error ?? null,
    retry: () => setAttempt((n) => n + 1),
    slow: true,
  };
}
