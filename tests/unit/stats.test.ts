import { describe, expect, it } from "vitest";
import { summarizeAttempts } from "@/lib/stats";

describe("summarizeAttempts", () => {
  it("computes attempts, correct count, and rate per question", () => {
    expect(
      summarizeAttempts([
        { questionId: "q1", isCorrect: true },
        { questionId: "q1", isCorrect: false },
        { questionId: "q2", isCorrect: true }
      ])
    ).toEqual({
      overall: { attempts: 3, correct: 2, correctRate: 2 / 3 },
      byQuestion: {
        q1: { attempts: 2, correct: 1, correctRate: 0.5 },
        q2: { attempts: 1, correct: 1, correctRate: 1 }
      }
    });
  });
});
