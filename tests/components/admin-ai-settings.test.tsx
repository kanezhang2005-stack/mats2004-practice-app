import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAiSettings } from "@/components/AdminAiSettings";

describe("AdminAiSettings", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and toggles the AI explanation setting", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ aiExplanationsEnabled: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ aiExplanationsEnabled: false })
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<AdminAiSettings />);

    const checkbox = await screen.findByRole("checkbox", { name: /enable ai explanations/i });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/settings/ai",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ aiExplanationsEnabled: false })
      })
    );
  });
});
