import { describe, expect, it, vi } from "vitest";
import { buildExplanationPrompt, createAiExplanation, extractResponseText } from "@/lib/ai-explanation";

const question = {
  prompt: "What is the average normal stress?",
  type: "numeric" as const,
  options: [],
  imageUrl: "/questions/tutorial-1-q01.png",
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
    expect(prompt).toContain("Do not use Markdown");
    expect(prompt).toContain("Use plain text formulas");
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

  it("sends the question image as vision context when an app URL is available", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: "Explanation from image" })
    });

    await createAiExplanation({
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      appUrl: "https://www.mats2004practice.com",
      question,
      submission: "10",
      correctAnswer: 12,
      fetcher: fetcher as unknown as typeof fetch
    });

    const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    expect(body.input[0].content).toContainEqual({
      type: "input_image",
      image_url: "https://www.mats2004practice.com/questions/tutorial-1-q01.png",
      detail: "high"
    });
  });
});
