import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "@/components/auth/SignInForm";

const mockSignIn = vi.fn();
let mockIsLoading = false;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signIn: mockSignIn, isLoading: mockIsLoading }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockIsLoading = false;
});

test("renders email, password fields and submit button", () => {
  render(<SignInForm />);
  expect(screen.getByLabelText("Email")).toBeDefined();
  expect(screen.getByLabelText("Password")).toBeDefined();
  expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
});

test("submits with entered email and password", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  const user = userEvent.setup();
  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  expect(mockSignIn).toHaveBeenCalledWith("a@b.com", "secret123");
});

test("calls onSuccess callback after successful sign-in", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  const onSuccess = vi.fn();
  const user = userEvent.setup();
  render(<SignInForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  expect(onSuccess).toHaveBeenCalledOnce();
});

test("does not call onSuccess when sign-in fails", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  const onSuccess = vi.fn();
  const user = userEvent.setup();
  render(<SignInForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  expect(onSuccess).not.toHaveBeenCalled();
});

test("shows error message when sign-in fails", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  const user = userEvent.setup();
  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  expect(screen.getByText("Invalid credentials")).toBeDefined();
});

test("shows fallback error message when error is undefined", async () => {
  mockSignIn.mockResolvedValue({ success: false });
  const user = userEvent.setup();
  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  expect(screen.getByText("Failed to sign in")).toBeDefined();
});

test("clears error on subsequent submit attempt", async () => {
  mockSignIn
    .mockResolvedValueOnce({ success: false, error: "Bad creds" })
    .mockResolvedValueOnce({ success: true });
  const user = userEvent.setup();
  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign In" }));
  expect(screen.getByText("Bad creds")).toBeDefined();

  await user.click(screen.getByRole("button", { name: "Sign In" }));
  expect(screen.queryByText("Bad creds")).toBeNull();
});

test("disables inputs and button while loading", () => {
  mockIsLoading = true;
  render(<SignInForm />);

  expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText("Password") as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
});

test("shows 'Signing in...' text while loading", () => {
  mockIsLoading = true;
  render(<SignInForm />);
  expect(screen.getByRole("button", { name: "Signing in..." })).toBeDefined();
});
