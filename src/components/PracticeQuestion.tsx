"use client";

import React, { useState } from "react";

export type PracticeQuestionData = {
  id: string;
  source: string;
  questionNumber: number;
  prompt: string;
  imageUrl: string;
  type: "single_choice" | "multi_choice" | "numeric" | "text";
  options: unknown;
  unit: string | null;
  status: "verified" | "needs_review";
};

type CheckResponse = {
  correct: boolean;
  answer: unknown;
  explanation: string | null;
  status: "verified" | "needs_review";
};

export function PracticeQuestion({
  question,
  onCheck
}: {
  question: PracticeQuestionData;
  onCheck: (questionId: string, submission: string | string[]) => Promise<CheckResponse>;
}) {
  const [submission, setSubmission] = useState<string | string[]>("");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const options = Array.isArray(question.options) ? question.options.map(String) : [];

  async function check() {
    setChecking(true);
    try {
      setResult(await onCheck(question.id, submission));
    } catch {
      setResult({
        correct: false,
        answer: null,
        explanation: "Could not check this answer. Please try again.",
        status: "needs_review"
      });
    } finally {
      setChecking(false);
    }
  }

  function toggleChoice(choice: string) {
    const current = Array.isArray(submission) ? submission : [];
    setSubmission(current.includes(choice) ? current.filter((item) => item !== choice) : [...current, choice]);
  }

  return (
    <article className="question-shell">
      <div className="question-meta">
        {question.source.replace("_", " ")} · Q{question.questionNumber}
      </div>
      <h2>{question.prompt}</h2>
      <img className="question-image" src={question.imageUrl} alt={`Question ${question.questionNumber}`} />

      <div className="answer-area">
        {question.type === "single_choice" &&
          options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return (
              <label key={option} className="option-row">
                <input type="radio" name={question.id} value={letter} onChange={() => setSubmission(letter)} />
                <span>
                  {letter}. {option}
                </span>
              </label>
            );
          })}

        {question.type === "multi_choice" &&
          options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return (
              <label key={option} className="option-row">
                <input type="checkbox" value={letter} onChange={() => toggleChoice(letter)} />
                <span>
                  {letter}. {option}
                </span>
              </label>
            );
          })}

        {(question.type === "numeric" || question.type === "text") && (
          <input
            className="answer-input"
            aria-label="Answer"
            placeholder={question.unit ? `Answer in ${question.unit}` : "Answer"}
            value={Array.isArray(submission) ? submission.join(",") : submission}
            onChange={(event) => setSubmission(event.target.value)}
          />
        )}

        <button className="primary-button" type="button" onClick={check} disabled={checking}>
          {checking ? "Checking" : "Check"}
        </button>
      </div>

      {result && (
        <section className={result.correct ? "result result-correct" : "result result-wrong"}>
          <strong>{result.correct ? "Correct" : "Incorrect"}</strong>
          <p>Standard answer: {JSON.stringify(result.answer)}</p>
          {result.status === "needs_review" && <p>This answer is pending verification.</p>}
          {result.explanation && <p>{result.explanation}</p>}
        </section>
      )}
    </article>
  );
}
