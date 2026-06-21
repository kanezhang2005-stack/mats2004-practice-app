import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminStats } from "@/components/AdminStats";

describe("AdminStats", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows normal tutorial question labels instead of database ids", async () => {
    const databaseId = "cmqnr5vn80000kr7lauthmu2b";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          overall: { attempts: 2, correct: 1, correctRate: 0.5 },
          byQuestion: {
            [databaseId]: { attempts: 2, correct: 1, correctRate: 0.5 }
          },
          questionLabels: {
            [databaseId]: "Tutorial 1 Q1"
          }
        })
      })
    );

    const user = userEvent.setup();
    render(<AdminStats />);

    await user.click(screen.getByRole("button", { name: /load stats/i }));

    expect(await screen.findByText("Tutorial 1 Q1")).toBeInTheDocument();
    expect(screen.queryByText(databaseId)).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Question" })).toBeInTheDocument();
  });

  it("clears answer history only after CLEAR confirmation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overall: { attempts: 2, correct: 1, correctRate: 0.5 },
          byQuestion: {
            q1: { attempts: 2, correct: 1, correctRate: 0.5 }
          },
          questionLabels: { q1: "Tutorial 1 Q1" }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overall: { attempts: 0, correct: 0, correctRate: 0 },
          byQuestion: {},
          questionLabels: {}
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<AdminStats />);

    await user.click(screen.getByRole("button", { name: /load stats/i }));
    await screen.findByText("Tutorial 1 Q1");

    await user.click(screen.getByRole("button", { name: /clear answer history/i }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText(/type clear/i), "CLEAR");
    await user.click(screen.getByRole("button", { name: /clear answer history/i }));

    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/admin/stats", { method: "DELETE" });
    expect(await screen.findByText(/total attempts: 0/i)).toBeInTheDocument();
  });
});
