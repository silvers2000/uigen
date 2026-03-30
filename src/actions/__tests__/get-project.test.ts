// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: mockGetSession }));

const mockFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { project: { findUnique: mockFindUnique } },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("throws Unauthorized when no session exists", async () => {
  mockGetSession.mockResolvedValue(null);
  const { getProject } = await import("@/actions/get-project");

  await expect(getProject("proj-1")).rejects.toThrow("Unauthorized");
  expect(mockFindUnique).not.toHaveBeenCalled();
});

test("queries by projectId scoped to the session user", async () => {
  mockGetSession.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
  mockFindUnique.mockResolvedValue({
    id: "proj-1",
    name: "Test",
    messages: "[]",
    data: "{}",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { getProject } = await import("@/actions/get-project");
  await getProject("proj-1");

  expect(mockFindUnique).toHaveBeenCalledWith({
    where: { id: "proj-1", userId: "user-1" },
  });
});

test("throws Project not found when project does not exist", async () => {
  mockGetSession.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
  mockFindUnique.mockResolvedValue(null);

  const { getProject } = await import("@/actions/get-project");

  await expect(getProject("missing")).rejects.toThrow("Project not found");
});

test("returns project with parsed messages and data", async () => {
  const now = new Date();
  const messages = [{ role: "user", content: "Hello" }];
  const data = { "/": {}, "/App.jsx": "code" };

  mockGetSession.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
  mockFindUnique.mockResolvedValue({
    id: "proj-1",
    name: "My Design",
    messages: JSON.stringify(messages),
    data: JSON.stringify(data),
    createdAt: now,
    updatedAt: now,
  });

  const { getProject } = await import("@/actions/get-project");
  const result = await getProject("proj-1");

  expect(result).toEqual({
    id: "proj-1",
    name: "My Design",
    messages,
    data,
    createdAt: now,
    updatedAt: now,
  });
});

test("throws Project not found when project belongs to a different user", async () => {
  mockGetSession.mockResolvedValue({ userId: "user-2", email: "b@b.com" });
  mockFindUnique.mockResolvedValue(null);

  const { getProject } = await import("@/actions/get-project");

  await expect(getProject("proj-1")).rejects.toThrow("Project not found");
});
