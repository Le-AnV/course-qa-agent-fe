import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/admin-api";
import { searchSessions } from "./api";

vi.mock("@/lib/admin-api", () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

describe("searchSessions", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("builds query params with class, limit and offset", async () => {
    mockedApiFetch.mockResolvedValue({ items: [], total: 0, query: "BFS" });

    await searchSessions("BFS", "class-1", 10, 20);

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/history/search?q=BFS&class_id=class-1&limit=10&offset=20",
    );
  });

  it("omits class_id when not provided", async () => {
    mockedApiFetch.mockResolvedValue({ items: [], total: 0, query: "BFS" });

    await searchSessions("BFS");

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/history/search?q=BFS&limit=20&offset=0",
    );
  });
});
