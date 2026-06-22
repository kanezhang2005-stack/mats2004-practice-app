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

function compactText(value: string): string {
  return normalizeText(value).replace(/\s+/g, "");
}

function asString(value: Submission): string {
  return Array.isArray(value) ? value.join(",") : String(value);
}

export function parseNumericSubmission(value: Submission): number {
  if (typeof value === "number") {
    return value;
  }

  const compact = asString(value)
    .trim()
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .replace(/×/g, "x");

  if (!compact) {
    return Number.NaN;
  }

  const numberPattern = "[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?";
  const metricMatch = compact.match(new RegExp(`^(${numberPattern})([kKmMgG])$`));
  if (metricMatch) {
    const metricMultipliers: Record<string, number> = {
      k: 1e3,
      m: 1e6,
      g: 1e9
    };
    const multiplier = metricMultipliers[metricMatch[2].toLowerCase()];
    return Number(metricMatch[1]) * multiplier;
  }

  const scientificMatch = compact.match(new RegExp(`^(${numberPattern})[*xX]10\\^([+-]?\\d+)$`));
  if (scientificMatch) {
    return Number(scientificMatch[1]) * 10 ** Number(scientificMatch[2]);
  }

  return Number(compact);
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
    const normalizedSubmission = parseNumericSubmission(submission);
    const tolerance = key.tolerance ?? 0;
    return {
      correct: Number.isFinite(normalizedSubmission) && Math.abs(normalizedSubmission - key.answer) <= tolerance,
      normalizedSubmission
    };
  }

  const normalizedSubmission = normalizeText(asString(submission));
  const normalizedAnswer = normalizeText(key.answer);
  return {
    correct: normalizedSubmission === normalizedAnswer || compactText(normalizedSubmission) === compactText(normalizedAnswer),
    normalizedSubmission
  };
}
