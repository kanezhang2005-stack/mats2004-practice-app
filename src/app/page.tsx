import { PracticeQuestion } from "@/components/PracticeQuestion";
import { listPublicQuestions } from "@/lib/questions";

async function checkAnswer(questionId: string, submission: string | string[]) {
  "use server";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
  const response = await fetch(`${baseUrl}/api/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId, submission })
  });
  return response.json();
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default async function Home({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const params = await searchParams;
  const questions = shuffle(await listPublicQuestions(params.source));
  const firstQuestion = questions[0];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MATS2004</p>
          <h1>Practice Questions</h1>
        </div>
        <form>
          <select name="source" defaultValue={params.source ?? ""} aria-label="Tutorial filter">
            <option value="">All tutorials</option>
            <option value="tutorial_1">Tutorial 1</option>
            <option value="tutorial_2">Tutorial 2</option>
            <option value="tutorial_3">Tutorial 3</option>
            <option value="tutorial_4">Tutorial 4</option>
          </select>
          <button type="submit">Filter</button>
        </form>
      </header>
      {firstQuestion ? (
        <PracticeQuestion question={firstQuestion} onCheck={checkAnswer} />
      ) : (
        <p>No questions found.</p>
      )}
    </main>
  );
}
