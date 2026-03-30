import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "@/components/auth/SignUpForm";

const mockSignUp = vi.fn();
let mockIsLoading = false;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signUp: mockSignUp, isLoading: mockIsLoading }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockIsLoading = false;
});

test("renders email, password, confirm password fields and submit button", () => {
  render(<SignUpForm />);
  expect(screen.getByLabelText("Email")).toBeDefined();
  expect(screen.getByLabelText("Password")).toBeDefined();
  expect(screen.getByLabelText("Confirm Password")).toBeDefined();
  expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
});

test("submits with email and password when passwords match", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  const user = userEvent.setup();
  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(mockSignUp).toHaveBeenCalledWith("a@b.com", "password123");
});

test("shows error and does not submit when passwords do not match", async () => {
  const user = userEvent.setup();
  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "different");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(screen.getByText("Passwords do not match")).toBeDefined();
  expect(mockSignUp).not.toHaveBeenCalled();
});

test("calls onSuccess callback after successful sign-up", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  const onSuccess = vi.fn();
  const user = userEvent.setup();
  render(<SignUpForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(onSuccess).toHaveBeenCalledOnce();
});

test("does not call onSuccess when sign-up fails", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already taken" });
  const onSuccess = vi.fn();
  const user = userEvent.setup();
  render(<SignUpForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(onSuccess).not.toHaveBeenCalled();
});

test("shows error message from server when sign-up fails", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already taken" });
  const user = userEvent.setup();
  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(screen.getByText("Email already taken")).toBeDefined();
});

test("shows fallback error message when server error is undefined", async () => {
  mockSignUp.mockResolvedValue({ success: false });
  const user = userEvent.setup();
  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(screen.getByText("Failed to sign up")).toBeDefined();
});

test("shows password minimum length hint", () => {
  render(<SignUpForm />);
  expect(screen.getByText("Must be at least 8 characters long")).toBeDefined();
});

test("disables all inputs and button while loading", () => {
  mockIsLoading = true;
  render(<SignUpForm />);

  expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText("Password") as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText("Confirm Password") as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
});

test("shows 'Creating account...' text while loading", () => {
  mockIsLoading = true;
  render(<SignUpForm />);
  expect(screen.getByRole("button", { name: "Creating account..." })).toBeDefined();
});
