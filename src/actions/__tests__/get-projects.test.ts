// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: mockGetSession }));

const mockFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { project: { findMany: mockFindMany } },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("throws Unauthorized when no session exists", async () => {
  mockGetSession.mockResolvedValue(null);
  const { getProjects } = await import("@/actions/get-projects");

  await expect(getProjects()).rejects.toThrow("Unauthorized");
  expect(mockFindMany).not.toHaveBeenCalled();
});

test("queries projects scoped to the session user ordered by updatedAt desc", async () => {
  mockGetSession.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
  mockFindMany.mockResolvedValue([]);

  const { getProjects } = await import("@/actions/get-projects");
  await getProjects();

  expect(mockFindMany).toHaveBeenCalledWith({
    where: { userId: "user-1" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
});

test("returns list of project metadata", async () => {
  const now = new Date();
  const projects = [
    { id: "proj-1", name: "Design A", createdAt: now, updatedAt: now },
    { id: "proj-2", name: "Design B", createdAt: now, updatedAt: now },
  ];
  mockGetSession.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
  mockFindMany.mockResolvedValue(projects);

  const { getProjects } = await import("@/actions/get-projects");
  const result = await getProjects();

  expect(result).toEqual(projects);
});

test("returns empty array when user has no projects", async () => {
  mockGetSession.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
  mockFindMany.mockResolvedValue([]);

  const { getProjects } = await import("@/actions/get-projects");
  const result = await getProjects();

  expect(result).toEqual([]);
});
