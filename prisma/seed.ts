import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db";

type SeedQuestion = {
  source: string;
  questionNumber: number;
  prompt: string;
  imageUrl: string;
  type: "single_choice" | "multi_choice" | "numeric" | "text";
  options: unknown[];
  answer: unknown;
  tolerance: number | null;
  unit: string | null;
  explanation: string | null;
  status: "verified" | "needs_review";
};

function toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

async function main() {
  const seedPath = path.join(process.cwd(), "data", "questions.seed.json");
  const raw = await fs.readFile(seedPath, "utf8");
  const questions = JSON.parse(raw) as SeedQuestion[];

  for (const question of questions) {
    await prisma.question.upsert({
      where: {
        source_questionNumber: {
          source: question.source,
          questionNumber: question.questionNumber
        }
      },
      update: {
        prompt: question.prompt,
        imageUrl: question.imageUrl,
        type: question.type,
        options: toPrismaJson(question.options),
        answer: toPrismaJson(question.answer),
        tolerance: question.tolerance,
        unit: question.unit,
        explanation: question.explanation,
        status: question.status
      },
      create: {
        ...question,
        options: toPrismaJson(question.options),
        answer: toPrismaJson(question.answer)
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
