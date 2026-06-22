import { describe, expect, it, vi } from "vitest";
import { buildExplanationPrompt, createAiExplanation, extractResponseText } from "@/lib/ai-explanation";

const question = {
  prompt: "What is the average normal stress?",
  type: "numeric" as const,
  options: [],
  unit: "MPa",
  status: "verified" as const
};

describe("AI explanation helpers", () => {
  it("builds a read-only explanation prompt with question context", () => {
    const prompt = buildExplanationPrompt({
      question,
      submission: "10",
      correctAnswer: 12
    });

    expect(prompt).toContain("Do not ask follow-up questions");
    expect(prompt).toContain("Question prompt:\nWhat is the average normal stress?");
    expect(prompt).toContain("Student answer: 10");
    expect(prompt).toContain("Standard answer: 12");
    expect(prompt).toContain("Unit: MPa");
  });

  it("extracts response text from the Responses API output", () => {
    expect(
      extractResponseText({
        output: [
          {
            content: [{ type: "output_text", text: "Use stress = force / area." }]
          }
        ]
      })
    ).toBe("Use stress = force / area.");
  });

  it("calls the Responses API and returns the explanation text", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: "Step-by-step explanation" })
    });

    await expect(
      createAiExplanation({
        apiKey: "sk-test",
        model: "gpt-4o-mini",
        question,
        submission: "10",
        correctAnswer: 12,
        fetcher: fetcher as unknown as typeof fetch
      })
    ).resolves.toBe("Step-by-step explanation");

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer sk-test"
        })
      })
    );
  });
});
