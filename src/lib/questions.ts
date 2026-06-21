import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

type SeedQuestion = {
  id?: string;
  source: string;
  questionNumber: number;
  prompt: string;
  imageUrl: string;
  type: "single_choice" | "multi_choice" | "numeric" | "text";
  options: unknown;
  unit: string | null;
  status: "verified" | "needs_review";
};

async function listSeedQuestions(source?: string) {
  const seedPath = path.join(process.cwd(), "data", "questions.seed.json");
  const raw = await fs.readFile(seedPath, "utf8");
  const questions = JSON.parse(raw) as SeedQuestion[];
  return questions
    .filter((question) => !source || question.source === source)
    .map((question) => ({
      id: question.id ?? `${question.source}_${question.questionNumber}`,
      source: question.source,
      questionNumber: question.questionNumber,
      prompt: question.prompt,
      imageUrl: question.imageUrl,
      type: question.type,
      options: question.options,
      unit: question.unit,
      status: question.status
    }));
}

export async function listPublicQuestions(source?: string) {
  if (!process.env.DATABASE_URL) {
    return listSeedQuestions(source);
  }

  const questions = await prisma.question.findMany({
    where: source ? { source } : undefined,
    orderBy: [{ source: "asc" }, { questionNumber: "asc" }]
  });

  return questions.map((question) => ({
    id: question.id,
    source: question.source,
    questionNumber: question.questionNumber,
    prompt: question.prompt,
    imageUrl: question.imageUrl,
    type: question.type,
    options: question.options,
    unit: question.unit,
    status: question.status
  }));
}
