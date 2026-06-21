import { describe, expect, it, vi } from "vitest";
import { isAdminPassword, requireAdmin } from "@/lib/admin-auth";

describe("admin auth", () => {
  it("accepts the configured admin password", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret-pass");
    await expect(isAdminPassword("secret-pass")).resolves.toBe(true);
  });

  it("rejects the wrong admin password", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret-pass");
    await expect(isAdminPassword("wrong")).resolves.toBe(false);
  });

  it("throws when an admin cookie is missing", async () => {
    await expect(requireAdmin(null)).rejects.toThrow("Admin authentication required");
  });
});
