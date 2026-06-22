import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
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
});
