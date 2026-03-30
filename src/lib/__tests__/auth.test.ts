// @vitest-environment node
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
const mockCookieDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      set: mockCookieSet,
      get: mockCookieGet,
      delete: mockCookieDelete,
    }),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.JWT_SECRET;
  delete process.env.NODE_ENV;
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("createSession sets an httpOnly cookie named auth-token", async () => {
  const { createSession } = await import("../auth");
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [name, , options] = mockCookieSet.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
});

test("createSession sets sameSite=lax and path=/", async () => {
  const { createSession } = await import("../auth");
  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets secure=false outside production", async () => {
  process.env.NODE_ENV = "development";
  const { createSession } = await import("../auth");
  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(false);
});

test("createSession sets secure=true in production", async () => {
  process.env.NODE_ENV = "production";
  const { createSession } = await import("../auth");
  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(true);
});

test("createSession sets cookie expiry ~7 days from now", async () => {
  const before = Date.now();
  const { createSession } = await import("../auth");
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const [, , options] = mockCookieSet.mock.calls[0];
  const expires: Date = options.expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession token is a valid JWT containing userId and email", async () => {
  const { createSession } = await import("../auth");
  await createSession("user-123", "test@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession token uses HS256 algorithm", async () => {
  const { createSession } = await import("../auth");
  await createSession("user-123", "test@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  const header = JSON.parse(atob(token.split(".")[0]));
  expect(header.alg).toBe("HS256");
});

test("createSession token expires in ~7 days", async () => {
  const before = Math.floor(Date.now() / 1000);
  const { createSession } = await import("../auth");
  await createSession("user-123", "test@example.com");
  const after = Math.floor(Date.now() / 1000);

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  const sevenDaysSec = 7 * 24 * 60 * 60;
  expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDaysSec - 5);
  expect(payload.exp).toBeLessThanOrEqual(after + sevenDaysSec + 5);
});
