import { test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const {
  mockPush,
  mockSignInAction,
  mockSignUpAction,
  mockGetAnonWorkData,
  mockClearAnonWork,
  mockGetProjects,
  mockCreateProject,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignInAction: vi.fn(),
  mockSignUpAction: vi.fn(),
  mockGetAnonWorkData: vi.fn(),
  mockClearAnonWork: vi.fn(),
  mockGetProjects: vi.fn(),
  mockCreateProject: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: mockSignInAction,
  signUp: mockSignUpAction,
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: mockGetAnonWorkData,
  clearAnonWork: mockClearAnonWork,
}));

vi.mock("@/actions/get-projects", () => ({ getProjects: mockGetProjects }));

vi.mock("@/actions/create-project", () => ({
  createProject: mockCreateProject,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
});

// signIn

test("signIn returns success result and redirects to most recent project", async () => {
  mockSignInAction.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([{ id: "proj-1" }, { id: "proj-2" }]);

  const { result } = renderHook(() => useAuth());
  let ret: any;
  await act(async () => {
    ret = await result.current.signIn("a@b.com", "password");
  });

  expect(ret).toEqual({ success: true });
  expect(mockPush).toHaveBeenCalledWith("/proj-1");
});

test("signIn returns failure and does not redirect", async () => {
  mockSignInAction.mockResolvedValue({ success: false, error: "Bad creds" });

  const { result } = renderHook(() => useAuth());
  let ret: any;
  await act(async () => {
    ret = await result.current.signIn("a@b.com", "wrong");
  });

  expect(ret).toEqual({ success: false, error: "Bad creds" });
  expect(mockPush).not.toHaveBeenCalled();
});

test("signIn creates a new project and redirects when user has no existing projects", async () => {
  mockSignInAction.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-proj" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("a@b.com", "password");
  });

  expect(mockCreateProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: [], data: {} })
  );
  expect(mockPush).toHaveBeenCalledWith("/new-proj");
});

test("signIn migrates anonymous work and redirects when anon work exists", async () => {
  const anonMessages = [{ role: "user", content: "Create a button" }];
  const anonData = { "/": {}, "/App.jsx": "code" };
  mockGetAnonWorkData.mockReturnValue({
    messages: anonMessages,
    fileSystemData: anonData,
  });
  mockSignInAction.mockResolvedValue({ success: true });
  mockCreateProject.mockResolvedValue({ id: "migrated-proj" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("a@b.com", "password");
  });

  expect(mockCreateProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: anonMessages, data: anonData })
  );
  expect(mockClearAnonWork).toHaveBeenCalled();
  expect(mockGetProjects).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/migrated-proj");
});

// signUp

test("signUp returns success result and redirects", async () => {
  mockSignUpAction.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([{ id: "proj-1" }]);

  const { result } = renderHook(() => useAuth());
  let ret: any;
  await act(async () => {
    ret = await result.current.signUp("a@b.com", "password");
  });

  expect(ret).toEqual({ success: true });
  expect(mockPush).toHaveBeenCalledWith("/proj-1");
});

test("signUp returns failure and does not redirect", async () => {
  mockSignUpAction.mockResolvedValue({ success: false, error: "Email taken" });

  const { result } = renderHook(() => useAuth());
  let ret: any;
  await act(async () => {
    ret = await result.current.signUp("a@b.com", "password");
  });

  expect(ret).toEqual({ success: false, error: "Email taken" });
  expect(mockPush).not.toHaveBeenCalled();
});

// isLoading

test("isLoading is false initially", () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);
});

test("isLoading is true during signIn and resets afterwards", async () => {
  let resolveFn!: (v: any) => void;
  mockSignInAction.mockReturnValue(new Promise((r) => (resolveFn = r)));

  const { result } = renderHook(() => useAuth());

  act(() => {
    result.current.signIn("a@b.com", "password");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveFn({ success: false, error: "err" });
  });

  expect(result.current.isLoading).toBe(false);
});
