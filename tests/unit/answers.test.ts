import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/answers";

describe("checkAnswer", () => {
  it("checks single choice answers after trimming and uppercasing", () => {
    expect(checkAnswer({ type: "single_choice", answer: "C" }, " c ")).toEqual({
      correct: true,
      normalizedSubmission: "C"
    });
  });

  it("checks multi choice answers without depending on order", () => {
    expect(checkAnswer({ type: "multi_choice", answer: ["A", "C", "D"] }, ["d", "a", "c"])).toEqual({
      correct: true,
      normalizedSubmission: ["A", "C", "D"]
    });
  });

  it("rejects multi choice answers with missing choices", () => {
    expect(checkAnswer({ type: "multi_choice", answer: ["A", "C"] }, ["A"])).toEqual({
      correct: false,
      normalizedSubmission: ["A"]
    });
  });

  it("checks numeric answers within tolerance", () => {
    expect(checkAnswer({ type: "numeric", answer: 12.5, tolerance: 0.05 }, "12.53")).toEqual({
      correct: true,
      normalizedSubmission: 12.53
    });
  });

  it("rejects numeric answers outside tolerance", () => {
    expect(checkAnswer({ type: "numeric", answer: 12.5, tolerance: 0.05 }, "12.57")).toEqual({
      correct: false,
      normalizedSubmission: 12.57
    });
  });

  it("checks text answers by trimming and ignoring case", () => {
    expect(checkAnswer({ type: "text", answer: "A-B and C-D" }, " a-b AND c-d ")).toEqual({
      correct: true,
      normalizedSubmission: "a-b and c-d"
    });
  });
});
