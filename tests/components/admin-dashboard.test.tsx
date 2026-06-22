import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "@/components/AdminDashboard";

describe("AdminDashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides admin controls until the password is accepted", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/admin/login") {
        return { ok: true };
      }
      if (url === "/api/admin/questions") {
        return { ok: true, json: async () => ({ questions: [] }) };
      }
      if (url === "/api/admin/settings/ai") {
        return { ok: true, json: async () => ({ aiExplanationsEnabled: true }) };
      }
      return { ok: false };
    }) as unknown as typeof fetch);

    const user = userEvent.setup();
    render(<AdminDashboard />);

    expect(screen.getByRole("heading", { name: /admin login/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /ai settings/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /anonymous statistics/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/admin password/i), "secret");
    await user.click(screen.getByRole("button", { name: /enter/i }));

    expect(await screen.findByRole("heading", { name: /ai settings/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /anonymous statistics/i })).toBeInTheDocument();
  });
});
