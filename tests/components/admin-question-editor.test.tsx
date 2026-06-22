import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminQuestionEditor } from "@/components/AdminQuestionEditor";

const numericQuestion = {
  id: "q1",
  source: "tutorial_1",
  questionNumber: 2,
  prompt: "Find the stress.",
  imageUrl: "/questions/tutorial-1-q02.png",
  type: "numeric" as const,
  options: [],
  answer: 1200,
  tolerance: 0.01,
  unit: null,
  explanation: null,
  status: "verified" as const
};

describe("AdminQuestionEditor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lets numeric answers be edited as plain decimals", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ questions: [numericQuestion] })
        })
    );

    const user = userEvent.setup();
    render(<AdminQuestionEditor />);

    await user.type(screen.getByLabelText(/admin password/i), "secret");
    await user.click(screen.getByRole("button", { name: /enter/i }));

    const answerInput = await screen.findByLabelText(/answer/i);
    await user.clear(answerInput);
    await user.type(answerInput, "222.");

    expect(answerInput).toHaveValue("222.");
  });
});
