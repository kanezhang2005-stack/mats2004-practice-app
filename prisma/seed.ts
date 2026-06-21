import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { buildSeedUpdateData } from "../src/lib/seed-policy";

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

function toPrismaUpdateData(question: SeedQuestion) {
  const updateData = buildSeedUpdateData(question);
  return {
    ...updateData,
    options: toPrismaJson(updateData.options)
  };
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
      update: toPrismaUpdateData(question),
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
