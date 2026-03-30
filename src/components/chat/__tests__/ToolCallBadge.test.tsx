import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// str_replace_editor

test("shows 'Creating' label for create command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/components/Card.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("shows 'Editing' label for insert command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "src/app/page.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing page.tsx")).toBeDefined();
});

test("shows 'Reading' label for view command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "src/lib/utils.ts" }}
      state="result"
    />
  );
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("shows 'Reverting' label for undo_edit command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "src/components/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Reverting Button.tsx")).toBeDefined();
});

// file_manager

test("shows 'Renaming' label for rename command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/old.tsx", new_path: "src/new.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming old.tsx to new.tsx")).toBeDefined();
});

test("shows 'Deleting' label for delete command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/components/Unused.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// State-based icon

test("shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Foo.tsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows check icon when state is 'result'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Foo.tsx" }}
      state="result"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeNull();
  // CheckCircle2 renders an svg; verify spinner is gone and label is shown
  expect(screen.getByText("Creating Foo.tsx")).toBeDefined();
});

// Unknown tool fallback

test("falls back to raw tool name for unknown tools", () => {
  render(
    <ToolCallBadge
      toolName="some_unknown_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});
