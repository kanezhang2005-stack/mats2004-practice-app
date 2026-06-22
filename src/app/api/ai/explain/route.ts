import fs from "node:fs/promises";
import path from "node:path";
import { checkAnswer, parseNumericSubmission, type QuestionType } from "@/lib/answers";
import { createAiExplanation } from "@/lib/ai-explanation";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  questionId: z.string().min(1),
  submission: z.union([z.string(), z.array(z.string()), z.number()])
});

type ExplainQuestion = {
  id?: string;
  source: string;
  questionNumber: number;
  prompt: string;
  imageUrl: string;
  type: QuestionType;
  options: unknown;
  answer: unknown;
  tolerance: number | null;
  unit: string | null;
  status: "verified" | "needs_review";
};

function toAnswerKey(question: {
  type: QuestionType;
  answer: unknown;
  tolerance: number | null;
}) {
  if (question.type === "single_choice") {
    return { type: question.type, answer: String(question.answer ?? "") };
  }
  if (question.type === "multi_choice") {
    return {
      type: question.type,
      answer: Array.isArray(question.answer) ? question.answer.map(String) : []
    };
  }
  if (question.type === "numeric") {
    return {
      type: question.type,
      answer: parseNumericSubmission(question.answer as string | string[] | number),
      tolerance: question.tolerance ?? undefined
    };
  }
  return { type: question.type, answer: String(question.answer ?? "") };
}

function answerForResponse(question: ExplainQuestion) {
  const answerKey = toAnswerKey(question);
  return answerKey.type === "numeric" && Number.isFinite(answerKey.answer) ? answerKey.answer : question.answer;
}

async function findSeedQuestion(questionId: string) {
  const raw = await fs.readFile(path.join(process.cwd(), "data", "questions.seed.json"), "utf8");
  const questions = JSON.parse(raw) as ExplainQuestion[];
  return questions.find((question) => `${question.source}_${question.questionNumber}` === questionId);
}

async function findQuestion(questionId: string): Promise<ExplainQuestion | null> {
  if (!process.env.DATABASE_URL) {
    return (await findSeedQuestion(questionId)) ?? null;
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId }
  });
  return question
    ? {
        ...question,
        type: question.type as QuestionType,
        status: question.status as "verified" | "needs_review"
      }
    : null;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI explanations are not configured." }, { status: 503 });
  }

  const body = schema.parse(await request.json());
  const question = await findQuestion(body.questionId);
  if (!question || question.answer === null) {
    return NextResponse.json({ error: "This question does not have a verified answer yet." }, { status: 400 });
  }

  const answerKey = toAnswerKey(question);
  const result = checkAnswer(answerKey, body.submission);
  if (result.correct) {
    return NextResponse.json({ error: "AI explanation is only available after an incorrect answer." }, { status: 400 });
  }

  const explanation = await createAiExplanation({
    apiKey,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    appUrl: new URL(request.url).origin,
    question,
    submission: body.submission,
    correctAnswer: answerForResponse(question)
  });

  return NextResponse.json({ explanation });
}
