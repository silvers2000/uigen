import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthDialog } from "@/components/auth/AuthDialog";

vi.mock("@/components/auth/SignInForm", () => ({
  SignInForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="sign-in-form">
      <button onClick={onSuccess}>Submit SignIn</button>
    </div>
  ),
}));

vi.mock("@/components/auth/SignUpForm", () => ({
  SignUpForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="sign-up-form">
      <button onClick={onSuccess}>Submit SignUp</button>
    </div>
  ),
}));

afterEach(() => cleanup());

test("renders SignInForm by default", () => {
  render(<AuthDialog open={true} onOpenChange={() => {}} />);
  expect(screen.getByTestId("sign-in-form")).toBeDefined();
  expect(screen.queryByTestId("sign-up-form")).toBeNull();
});

test("renders SignUpForm when defaultMode is signup", () => {
  render(
    <AuthDialog open={true} onOpenChange={() => {}} defaultMode="signup" />
  );
  expect(screen.getByTestId("sign-up-form")).toBeDefined();
  expect(screen.queryByTestId("sign-in-form")).toBeNull();
});

test("shows correct title for signin mode", () => {
  render(<AuthDialog open={true} onOpenChange={() => {}} defaultMode="signin" />);
  expect(screen.getByText("Welcome back")).toBeDefined();
});

test("shows correct title for signup mode", () => {
  render(<AuthDialog open={true} onOpenChange={() => {}} defaultMode="signup" />);
  expect(screen.getByText("Create an account")).toBeDefined();
});

test("switches from signin to signup when 'Sign up' link is clicked", async () => {
  const user = userEvent.setup();
  render(<AuthDialog open={true} onOpenChange={() => {}} />);

  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(screen.getByTestId("sign-up-form")).toBeDefined();
  expect(screen.getByText("Create an account")).toBeDefined();
});

test("switches from signup to signin when 'Sign in' link is clicked", async () => {
  const user = userEvent.setup();
  render(
    <AuthDialog open={true} onOpenChange={() => {}} defaultMode="signup" />
  );

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(screen.getByTestId("sign-in-form")).toBeDefined();
  expect(screen.getByText("Welcome back")).toBeDefined();
});

test("calls onOpenChange(false) when form succeeds", async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  render(<AuthDialog open={true} onOpenChange={onOpenChange} />);

  await user.click(screen.getByRole("button", { name: "Submit SignIn" }));

  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("does not render content when open is false", () => {
  render(<AuthDialog open={false} onOpenChange={() => {}} />);
  expect(screen.queryByTestId("sign-in-form")).toBeNull();
});

test("syncs mode when defaultMode prop changes", async () => {
  const { rerender } = render(
    <AuthDialog open={true} onOpenChange={() => {}} defaultMode="signin" />
  );
  expect(screen.getByTestId("sign-in-form")).toBeDefined();

  rerender(
    <AuthDialog open={true} onOpenChange={() => {}} defaultMode="signup" />
  );
  expect(screen.getByTestId("sign-up-form")).toBeDefined();
});
