import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PracticeSession } from "@/components/PracticeSession";
import type { PracticeQuestionData } from "@/components/PracticeQuestion";

const questions: PracticeQuestionData[] = [
  {
    id: "q1",
    source: "tutorial_1",
    questionNumber: 1,
    prompt: "First question",
    imageUrl: "/questions/tutorial-1-q01.png",
    type: "text",
    options: [],
    unit: null,
    status: "verified"
  },
  {
    id: "q2",
    source: "tutorial_1",
    questionNumber: 2,
    prompt: "Second question",
    imageUrl: "/questions/tutorial-1-q02.png",
    type: "text",
    options: [],
    unit: null,
    status: "verified"
  }
];

describe("PracticeSession", () => {
  it("moves to the next question without refreshing the page", async () => {
    const user = userEvent.setup();
    render(<PracticeSession questions={questions} onCheck={vi.fn()} />);

    expect(screen.getByText("First question")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next question/i }));

    expect(screen.getByText("Second question")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("moves back to the previous question", async () => {
    const user = userEvent.setup();
    render(<PracticeSession questions={questions} onCheck={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /next question/i }));
    expect(screen.getByText("Second question")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous question/i }));

    expect(screen.getByText("First question")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("can hide the standard answer in exam mode", async () => {
    const user = userEvent.setup();
    render(
      <PracticeSession
        questions={questions}
        onCheck={vi.fn().mockResolvedValue({
          correct: false,
          answer: "2P",
          explanation: "Use equilibrium.",
          status: "verified"
        })}
      />
    );

    await user.selectOptions(screen.getByLabelText(/mode/i), "exam");
    await user.type(screen.getByLabelText(/answer/i), "P");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/^Incorrect$/i)).toBeInTheDocument();
    expect(screen.queryByText(/standard answer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/use equilibrium/i)).not.toBeInTheDocument();
  });
});
