import { describe, expect, it } from "vitest";
import { buildQuestionLabels, summarizeAttempts } from "@/lib/stats";

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

describe("buildQuestionLabels", () => {
  it("formats database question ids as tutorial question labels", () => {
    expect(
      buildQuestionLabels([
        { id: "cmqnr5vn80000kr7lauthmu2b", source: "tutorial_1", questionNumber: 1 },
        { id: "cmqnr5vpg000ckr7l0wmgmok3", source: "tutorial_3", questionNumber: 12 }
      ])
    ).toEqual({
      cmqnr5vn80000kr7lauthmu2b: "Tutorial 1 Q1",
      cmqnr5vpg000ckr7l0wmgmok3: "Tutorial 3 Q12"
    });
  });
});
