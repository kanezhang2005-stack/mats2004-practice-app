export type QuestionType = "single_choice" | "multi_choice" | "numeric" | "text";

type AnswerKey =
  | { type: "single_choice"; answer: string }
  | { type: "multi_choice"; answer: string[] }
  | { type: "numeric"; answer: number; tolerance?: number }
  | { type: "text"; answer: string };

type Submission = string | string[] | number;

export type CheckResult =
  | { correct: boolean; normalizedSubmission: string }
  | { correct: boolean; normalizedSubmission: string[] }
  | { correct: boolean; normalizedSubmission: number };

function normalizeChoice(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function asString(value: Submission): string {
  return Array.isArray(value) ? value.join(",") : String(value);
}

export function checkAnswer(key: AnswerKey, submission: Submission): CheckResult {
  if (key.type === "single_choice") {
    const normalizedSubmission = normalizeChoice(asString(submission));
    return {
      correct: normalizedSubmission === normalizeChoice(key.answer),
      normalizedSubmission
    };
  }

  if (key.type === "multi_choice") {
    const values = Array.isArray(submission) ? submission : asString(submission).split(",");
    const normalizedSubmission = values.map(normalizeChoice).filter(Boolean).sort();
    const normalizedAnswer = key.answer.map(normalizeChoice).filter(Boolean).sort();
    return {
      correct: JSON.stringify(normalizedSubmission) === JSON.stringify(normalizedAnswer),
      normalizedSubmission
    };
  }

  if (key.type === "numeric") {
    const normalizedSubmission = typeof submission === "number" ? submission : Number(asString(submission));
    const tolerance = key.tolerance ?? 0;
    return {
      correct: Number.isFinite(normalizedSubmission) && Math.abs(normalizedSubmission - key.answer) <= tolerance,
      normalizedSubmission
    };
  }

  const normalizedSubmission = normalizeText(asString(submission));
  return {
    correct: normalizedSubmission === normalizeText(key.answer),
    normalizedSubmission
  };
}
