import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeQuestion } from "@/components/PracticeQuestion";

const question = {
  id: "q1",
  source: "tutorial_3",
  questionNumber: 2,
  prompt: "What does J represent?",
  imageUrl: "/questions/tutorial-3-q02.png",
  type: "single_choice" as const,
  options: ["Axial loading", "Bending", "Twisting resistance", "Energy"],
  unit: null,
  status: "verified" as const
};

describe("PracticeQuestion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("hides the answer before checking", () => {
    render(<PracticeQuestion question={question} onCheck={vi.fn()} />);
    expect(screen.getByRole("img", { name: /question 2/i })).toHaveAttribute("src", question.imageUrl);
    expect(screen.queryByText(/standard answer/i)).not.toBeInTheDocument();
  });

  it("shows the result after checking", async () => {
    const user = userEvent.setup();
    render(
      <PracticeQuestion
        question={question}
        onCheck={vi.fn().mockResolvedValue({ correct: true, answer: "C", explanation: "Because J resists twist.", status: "verified" })}
      />
    );

    await user.click(screen.getByRole("radio", { name: /twisting/i }));
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/^Correct$/i)).toBeInTheDocument();
    expect(screen.getByText(/standard answer/i)).toBeInTheDocument();
  });

  it("does not duplicate choice options embedded in the prompt", () => {
    render(
      <PracticeQuestion
        question={{
          ...question,
          prompt: "What is represented by point A?\nA. Ultimate Stress\nB. End of Elastic Region\nC. Fracture Stress"
        }}
        onCheck={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "What is represented by point A?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /ultimate stress/i })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /A\. Axial loading/i })).toBeInTheDocument();
  });

  it("shows a read-only AI explanation modal after an incorrect answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ explanation: "Use torque equilibrium to compare the segments." })
      })
    );
    const user = userEvent.setup();
    render(
      <PracticeQuestion
        question={question}
        onCheck={vi.fn().mockResolvedValue({ correct: false, answer: "C", explanation: "Because J resists twist.", status: "verified" })}
      />
    );

    await user.click(screen.getByRole("radio", { name: /bending/i }));
    await user.click(screen.getByRole("button", { name: /check/i }));
    await user.click(await screen.findByRole("button", { name: /^explain$/i }));

    expect(await screen.findByRole("dialog", { name: /ai explanation/i })).toBeInTheDocument();
    expect(screen.getByText(/use torque equilibrium/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("does not show AI explanation in exam mode", async () => {
    const user = userEvent.setup();
    render(
      <PracticeQuestion
        question={question}
        revealAnswer={false}
        onCheck={vi.fn().mockResolvedValue({ correct: false, answer: "C", explanation: "Because J resists twist.", status: "verified" })}
      />
    );

    await user.click(screen.getByRole("radio", { name: /bending/i }));
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/^Incorrect$/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^explain$/i })).not.toBeInTheDocument();
  });
});
