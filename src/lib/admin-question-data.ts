import { Prisma } from "@prisma/client";
import { parseNumericSubmission } from "@/lib/answers";

type QuestionInput = {
  prompt: string;
  imageUrl: string;
  type: "single_choice" | "multi_choice" | "numeric" | "text";
  options: unknown;
  answer: unknown;
  tolerance: number | null;
  unit: string | null;
  explanation: string | null;
  status: "verified" | "needs_review";
};

function toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function normalizeAnswer(input: QuestionInput): unknown {
  if (input.type !== "numeric" || input.answer === null) {
    return input.answer;
  }

  const parsedAnswer = parseNumericSubmission(input.answer as string | string[] | number);
  return Number.isFinite(parsedAnswer) ? parsedAnswer : input.answer;
}

export function buildQuestionUpdateData(input: QuestionInput) {
  return {
    prompt: input.prompt,
    imageUrl: input.imageUrl,
    type: input.type,
    options: toPrismaJson(input.options),
    answer: toPrismaJson(normalizeAnswer(input)),
    tolerance: input.tolerance,
    unit: input.unit,
    explanation: input.explanation,
    status: input.status
  };
}
