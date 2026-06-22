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

function displayPrompt(question: PracticeQuestionData) {
  if (question.type !== "single_choice" && question.type !== "multi_choice") {
    return question.prompt;
  }

  return question.prompt
    .split(/\r?\n/)
    .filter((line) => !/^[A-Z]\.\s+/.test(line.trim()))
    .join("\n")
    .trim();
}

function formatAiExplanation(text: string) {
  return text
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\\times\b/g, "x")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function PracticeQuestion({
  question,
  onCheck,
  revealAnswer = true,
  aiExplanationsEnabled = true
}: {
  question: PracticeQuestionData;
  onCheck: (questionId: string, submission: string | string[]) => Promise<CheckResponse>;
  revealAnswer?: boolean;
  aiExplanationsEnabled?: boolean;
}) {
  const [submission, setSubmission] = useState<string | string[]>("");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiError, setAiError] = useState("");
  const options = Array.isArray(question.options) ? question.options.map(String) : [];

  async function check() {
    setChecking(true);
    setAiExplanation("");
    setAiError("");
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

  async function explain() {
    setExplaining(true);
    setAiError("");
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.id, submission })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate an explanation.");
      }
      setAiExplanation(data.explanation);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Could not generate an explanation.");
    } finally {
      setExplaining(false);
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
      <h2>{displayPrompt(question)}</h2>
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
          {revealAnswer && <p>Standard answer: {JSON.stringify(result.answer)}</p>}
          {revealAnswer && result.status === "needs_review" && <p>This answer is pending verification.</p>}
          {revealAnswer && result.explanation && <p>{result.explanation}</p>}
          {revealAnswer && aiExplanationsEnabled && !result.correct && (
            <button className="secondary-button" type="button" onClick={explain} disabled={explaining}>
              {explaining ? "Generating explanation" : "Explain"}
            </button>
          )}
          {aiError && <p>{aiError}</p>}
        </section>
      )}
      {aiExplanation && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="AI Explanation">
          <section className="modal-panel">
            <h3>AI Explanation</h3>
            <div className="ai-explanation">{formatAiExplanation(aiExplanation)}</div>
            <button className="primary-button" type="button" onClick={() => setAiExplanation("")}>
              Close
            </button>
          </section>
        </div>
      )}
    </article>
  );
}
