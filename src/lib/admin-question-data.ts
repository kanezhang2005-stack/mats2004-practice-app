import { Prisma } from "@prisma/client";

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

export function buildQuestionUpdateData(input: QuestionInput) {
  return {
    prompt: input.prompt,
    imageUrl: input.imageUrl,
    type: input.type,
    options: toPrismaJson(input.options),
    answer: toPrismaJson(input.answer),
    tolerance: input.tolerance,
    unit: input.unit,
    explanation: input.explanation,
    status: input.status
  };
}
