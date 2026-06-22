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
  aiExplanation: null,
  status: "verified" as const
};

const textQuestion = {
  ...numericQuestion,
  id: "q2",
  questionNumber: 3,
  type: "text" as const,
  answer: "2P"
};

const singleChoiceQuestion = {
  ...numericQuestion,
  id: "q3",
  questionNumber: 4,
  type: "single_choice" as const,
  options: ["Ultimate Stress", "End of Elastic Region", "Fracture Stress"],
  answer: "C",
  tolerance: null
};

const questionWithAiCache = {
  ...numericQuestion,
  aiExplanation: "Cached explanation"
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

  it("edits choice options as one option per line", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [singleChoiceQuestion] })
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [singleChoiceQuestion] })
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<AdminQuestionEditor />);

    await user.type(screen.getByLabelText(/admin password/i), "secret");
    await user.click(screen.getByRole("button", { name: /enter/i }));

    const optionsInput = await screen.findByLabelText(/^options$/i);
    expect(optionsInput).toHaveValue("Ultimate Stress\nEnd of Elastic Region\nFracture Stress");

    await user.clear(optionsInput);
    await user.type(optionsInput, "A-B\nB-C\nC-D");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({
      options: ["A-B", "B-C", "C-D"]
    });
  });

  it("hides options for numeric and text questions", async () => {
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

    expect(await screen.findByLabelText(/answer/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^options$/i)).not.toBeInTheDocument();
  });

  it("shows and clears cached AI explanations", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [questionWithAiCache] })
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [numericQuestion] })
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<AdminQuestionEditor />);

    await user.type(screen.getByLabelText(/admin password/i), "secret");
    await user.click(screen.getByRole("button", { name: /enter/i }));

    expect(await screen.findByText(/AI cache: saved/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear cached ai explanation/i }));

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/admin/questions/q1/ai-explanation", { method: "DELETE" });
  });
});
