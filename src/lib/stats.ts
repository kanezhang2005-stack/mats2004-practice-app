import { prisma } from "@/lib/db";

type AttemptLike = {
  questionId: string;
  isCorrect: boolean;
};

type Stat = {
  attempts: number;
  correct: number;
  correctRate: number;
};

export function summarizeAttempts(attempts: AttemptLike[]) {
  const byQuestion: Record<string, Stat> = {};
  const overall: Stat = { attempts: 0, correct: 0, correctRate: 0 };

  for (const attempt of attempts) {
    byQuestion[attempt.questionId] ??= { attempts: 0, correct: 0, correctRate: 0 };
    byQuestion[attempt.questionId].attempts += 1;
    overall.attempts += 1;

    if (attempt.isCorrect) {
      byQuestion[attempt.questionId].correct += 1;
      overall.correct += 1;
    }
  }

  for (const stat of Object.values(byQuestion)) {
    stat.correctRate = stat.attempts === 0 ? 0 : stat.correct / stat.attempts;
  }
  overall.correctRate = overall.attempts === 0 ? 0 : overall.correct / overall.attempts;

  return { overall, byQuestion };
}

export async function recordAttempt(questionId: string, isCorrect: boolean) {
  return prisma.attempt.create({
    data: { questionId, isCorrect }
  });
}

export async function getAggregateStats() {
  const attempts = await prisma.attempt.findMany({
    select: { questionId: true, isCorrect: true }
  });
  return summarizeAttempts(attempts);
}
