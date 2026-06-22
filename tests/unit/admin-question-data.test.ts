import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { buildQuestionUpdateData } from "@/lib/admin-question-data";

describe("buildQuestionUpdateData", () => {
  it("keeps editable question fields and strips database metadata", () => {
    expect(
      buildQuestionUpdateData({
        id: "cmqnr5vry000wkr7lnta336zr",
        createdAt: "2026-06-21T00:00:00.000Z",
        updatedAt: "2026-06-22T00:00:00.000Z",
        prompt: "Determine the moment reaction.",
        imageUrl: "/questions/tutorial-4-q01.png",
        type: "numeric",
        options: [],
        answer: 6,
        tolerance: 0.01,
        unit: null,
        explanation: "Moment equilibrium gives the reaction.",
        status: "verified"
      })
    ).toEqual({
      prompt: "Determine the moment reaction.",
      imageUrl: "/questions/tutorial-4-q01.png",
      type: "numeric",
      options: [],
      answer: 6,
      tolerance: 0.01,
      unit: null,
      explanation: "Moment equilibrium gives the reaction.",
      status: "verified"
    });
  });

  it("stores explicit JSON null values with Prisma's JSON null sentinel", () => {
    expect(
      buildQuestionUpdateData({
        prompt: "Unverified question",
        imageUrl: "/questions/tutorial-1-q02.png",
        type: "numeric",
        options: [],
        answer: null,
        tolerance: null,
        unit: null,
        explanation: null,
        status: "needs_review"
      })
    ).toEqual({
      prompt: "Unverified question",
      imageUrl: "/questions/tutorial-1-q02.png",
      type: "numeric",
      options: [],
      answer: Prisma.JsonNull,
      tolerance: null,
      unit: null,
      explanation: null,
      status: "needs_review"
    });
  });

  it("normalizes numeric answers before saving", () => {
    expect(
      buildQuestionUpdateData({
        prompt: "Numeric question",
        imageUrl: "/questions/tutorial-1-q02.png",
        type: "numeric",
        options: [],
        answer: "1.2k",
        tolerance: 0.01,
        unit: null,
        explanation: null,
        status: "verified"
      }).answer
    ).toBe(1200);
  });
});
