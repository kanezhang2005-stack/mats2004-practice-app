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

const textQuestion = {
  ...numericQuestion,
  id: "q2",
  questionNumber: 3,
  type: "text" as const,
  answer: "2P"
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

  it("lets text answers be edited without JSON quotes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ questions: [textQuestion] })
        })
    );

    const user = userEvent.setup();
    render(<AdminQuestionEditor />);

    await user.type(screen.getByLabelText(/admin password/i), "secret");
    await user.click(screen.getByRole("button", { name: /enter/i }));

    const answerInput = await screen.findByLabelText(/answer/i);
    expect(answerInput).toHaveValue("2P");

    await user.clear(answerInput);
    await user.type(answerInput, "P/2");

    expect(answerInput).toHaveValue("P/2");
  });

  it("lets tolerance be edited as a decimal in progress", async () => {
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

    const toleranceInput = await screen.findByLabelText(/tolerance/i);
    await user.clear(toleranceInput);
    await user.type(toleranceInput, "0.");

    expect(toleranceInput).toHaveValue("0.");
  });
});
