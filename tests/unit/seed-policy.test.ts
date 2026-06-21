import { describe, expect, it } from "vitest";
import { buildSeedUpdateData } from "@/lib/seed-policy";

describe("seed update policy", () => {
  it("does not overwrite admin-managed answer fields during deploy seed", () => {
    const seedQuestion = {
      prompt: "Seed prompt",
      imageUrl: "/questions/tutorial-1-q01.png",
      type: "single_choice",
      options: ["A", "B"],
      answer: null,
      tolerance: null,
      unit: null,
      explanation: null,
      status: "needs_review"
    };

    expect(buildSeedUpdateData(seedQuestion)).toEqual({
      prompt: "Seed prompt",
      imageUrl: "/questions/tutorial-1-q01.png",
      type: "single_choice",
      options: ["A", "B"],
      unit: null
    });
  });
});
