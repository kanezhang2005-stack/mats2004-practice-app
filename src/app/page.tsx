import { PracticeSession } from "@/components/PracticeSession";
import { getAiExplanationsEnabled } from "@/lib/app-settings";
import { listPublicQuestions } from "@/lib/questions";
import { headers } from "next/headers";

async function checkAnswer(questionId: string, submission: string | string[]) {
  "use server";
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "127.0.0.1:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("127.0.0.1") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const response = await fetch(`${baseUrl}/api/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId, submission })
  });
  if (!response.ok) {
    return {
      correct: false,
      answer: null,
      explanation: "Could not check this answer. Please try again.",
      status: "needs_review" as const
    };
  }
  return response.json();
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default async function Home({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const params = await searchParams;
  const questions = shuffle(await listPublicQuestions(params.source));
  const aiExplanationsEnabled = await getAiExplanationsEnabled();

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
      {questions.length ? (
        <PracticeSession questions={questions} onCheck={checkAnswer} aiExplanationsEnabled={aiExplanationsEnabled} />
      ) : (
        <p>No questions found.</p>
      )}
    </main>
  );
}
