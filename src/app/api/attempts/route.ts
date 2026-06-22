import fs from "node:fs/promises";
import path from "node:path";
import { checkAnswer, parseNumericSubmission, type QuestionType } from "@/lib/answers";
import { prisma } from "@/lib/db";
import { recordAttempt } from "@/lib/stats";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  questionId: z.string().min(1),
  submission: z.union([z.string(), z.array(z.string()), z.number()])
});

type SeedQuestion = {
  source: string;
  questionNumber: number;
  type: QuestionType;
  answer: unknown;
  tolerance: number | null;
  explanation: string | null;
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

function answerForResponse(question: {
  type: QuestionType;
  answer: unknown;
  tolerance: number | null;
}) {
  const answerKey = toAnswerKey(question);
  return answerKey.type === "numeric" && Number.isFinite(answerKey.answer) ? answerKey.answer : question.answer;
}

async function findSeedQuestion(questionId: string) {
  const raw = await fs.readFile(path.join(process.cwd(), "data", "questions.seed.json"), "utf8");
  const questions = JSON.parse(raw) as SeedQuestion[];
  return questions.find((question) => `${question.source}_${question.questionNumber}` === questionId);
}

export async function POST(request: Request) {
  const body = schema.parse(await request.json());

  if (!process.env.DATABASE_URL) {
    const question = await findSeedQuestion(body.questionId);
    if (!question || question.answer === null) {
      return NextResponse.json({
        correct: false,
        answer: question?.answer ?? null,
        explanation: question?.explanation ?? "Answer requires verification.",
        status: question?.status ?? "needs_review"
      });
    }

    const answerKey = toAnswerKey(question);
    const result = checkAnswer(answerKey, body.submission);
    return NextResponse.json({
      correct: result.correct,
      answer: answerForResponse(question),
      explanation: question.explanation,
      status: question.status
    });
  }

  const question = await prisma.question.findUniqueOrThrow({
    where: { id: body.questionId }
  });

  if (question.answer === null) {
    return NextResponse.json({
      correct: false,
      answer: question.answer,
      explanation: question.explanation,
      status: question.status
    });
  }

  const answerKey = toAnswerKey(question);
  const result = checkAnswer(answerKey, body.submission);

  await recordAttempt(question.id, result.correct);

  return NextResponse.json({
    correct: result.correct,
    answer: answerForResponse(question),
    explanation: question.explanation,
    status: question.status
  });
}
