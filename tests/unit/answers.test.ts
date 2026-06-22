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

  it("accepts numeric answers written with scientific notation", () => {
    expect(checkAnswer({ type: "numeric", answer: 1200000000 }, "1.2*10^9")).toEqual({
      correct: true,
      normalizedSubmission: 1200000000
    });

    expect(checkAnswer({ type: "numeric", answer: 1200000000 }, "1.2 x 10^9")).toEqual({
      correct: true,
      normalizedSubmission: 1200000000
    });
  });

  it("accepts numeric answers written with metric suffixes", () => {
    expect(checkAnswer({ type: "numeric", answer: 1200000000 }, "1200M")).toEqual({
      correct: true,
      normalizedSubmission: 1200000000
    });

    expect(checkAnswer({ type: "numeric", answer: 1200000000 }, "1.2G")).toEqual({
      correct: true,
      normalizedSubmission: 1200000000
    });
  });

  it("checks text answers by trimming and ignoring case", () => {
    expect(checkAnswer({ type: "text", answer: "A-B and C-D" }, " a-b AND c-d ")).toEqual({
      correct: true,
      normalizedSubmission: "a-b and c-d"
    });
  });

  it("checks short text formulas without depending on spaces", () => {
    expect(checkAnswer({ type: "text", answer: "2P" }, "2 P")).toEqual({
      correct: true,
      normalizedSubmission: "2 p"
    });
  });
});
