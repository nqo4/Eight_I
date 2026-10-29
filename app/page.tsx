// 최소 화면: 배포·docker 경로 확인용. 문구는 docs/problem.yaml의 product 항목을 그대로 썼다.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-4xl font-bold">CodeBack</h1>
      <p className="text-xl">AI가 만든 코드를, 진짜 내 코드로.</p>
      <p className="leading-relaxed opacity-80">
        사용자가 AI로 만든 GitHub 프로젝트를 입력하면, 완성된 기능에서 출발해 관련
        파일·코드·기초 개념을 차례대로 이해하고 직접 작은 수정을 해보는 학습 서비스.
      </p>
    </main>
  );
}
