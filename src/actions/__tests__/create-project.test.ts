// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: mockGetSession }));

const mockProjectCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { project: { create: mockProjectCreate } },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("throws Unauthorized when no session exists", async () => {
  mockGetSession.mockResolvedValue(null);
  const { createProject } = await import("@/actions/create-project");

  await expect(
    createProject({ name: "Test", messages: [], data: {} })
  ).rejects.toThrow("Unauthorized");

  expect(mockProjectCreate).not.toHaveBeenCalled();
});

test("creates a project with serialized messages and data", async () => {
  mockGetSession.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
  const created = {
    id: "proj-1",
    name: "My Project",
    userId: "user-1",
    messages: "[]",
    data: "{}",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockProjectCreate.mockResolvedValue(created);

  const { createProject } = await import("@/actions/create-project");
  const messages = [{ role: "user", content: "Hello" }];
  const data = { "/": {}, "/App.jsx": "code" };

  const result = await createProject({ name: "My Project", messages, data });

  expect(mockProjectCreate).toHaveBeenCalledWith({
    data: {
      name: "My Project",
      userId: "user-1",
      messages: JSON.stringify(messages),
      data: JSON.stringify(data),
    },
  });
  expect(result).toEqual(created);
});

test("passes empty arrays and objects as serialized JSON strings", async () => {
  mockGetSession.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
  mockProjectCreate.mockResolvedValue({ id: "proj-2" });

  const { createProject } = await import("@/actions/create-project");
  await createProject({ name: "Empty", messages: [], data: {} });

  const callArg = mockProjectCreate.mock.calls[0][0];
  expect(callArg.data.messages).toBe("[]");
  expect(callArg.data.data).toBe("{}");
});
