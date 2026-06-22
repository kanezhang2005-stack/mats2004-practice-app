"use client";

import React, { useState } from "react";
import { PracticeQuestion, type PracticeQuestionData } from "@/components/PracticeQuestion";

type CheckResponse = {
  correct: boolean;
  answer: unknown;
  explanation: string | null;
  status: "verified" | "needs_review";
};

export function PracticeSession({
  questions,
  onCheck
}: {
  questions: PracticeQuestionData[];
  onCheck: (questionId: string, submission: string | string[]) => Promise<CheckResponse>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const currentQuestion = questions[currentIndex];

  function nextQuestion() {
    setCurrentIndex((index) => (index + 1) % questions.length);
  }

  function previousQuestion() {
    setCurrentIndex((index) => (index - 1 + questions.length) % questions.length);
  }

  if (!currentQuestion) {
    return <p>No questions found.</p>;
  }

  return (
    <section className="practice-session">
      <div className="session-controls">
        <span>{currentIndex + 1} / {questions.length}</span>
        <label>
          Mode
          <select value={mode} onChange={(event) => setMode(event.target.value as "practice" | "exam")}>
            <option value="practice">Practice</option>
            <option value="exam">Exam</option>
          </select>
        </label>
        <button type="button" onClick={previousQuestion}>
          Previous question
        </button>
        <button type="button" onClick={nextQuestion}>
          Next question
        </button>
      </div>
      <PracticeQuestion
        key={currentQuestion.id}
        question={currentQuestion}
        onCheck={onCheck}
        revealAnswer={mode === "practice"}
      />
    </section>
  );
}
