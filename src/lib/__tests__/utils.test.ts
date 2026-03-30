import { test, expect } from "vitest";
import { cn } from "@/lib/utils";

test("returns a single class unchanged", () => {
  expect(cn("text-red-500")).toBe("text-red-500");
});

test("merges multiple classes", () => {
  expect(cn("p-4", "m-2")).toBe("p-4 m-2");
});

test("handles conditional classes with objects", () => {
  expect(cn("base", { "text-red-500": true, "text-blue-500": false })).toBe(
    "base text-red-500"
  );
});

test("handles conditional classes with arrays", () => {
  expect(cn(["p-4", "m-2"])).toBe("p-4 m-2");
});

test("resolves conflicting Tailwind classes — last one wins", () => {
  expect(cn("p-4", "p-2")).toBe("p-2");
  expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
});

test("ignores falsy values", () => {
  expect(cn("base", undefined, null, false, "extra")).toBe("base extra");
});

test("returns empty string when no valid classes are provided", () => {
  expect(cn()).toBe("");
  expect(cn(undefined, null, false)).toBe("");
});

test("handles mixed arrays and object conditionals", () => {
  expect(cn(["px-4", "py-2"], { "font-bold": true, italic: false })).toBe(
    "px-4 py-2 font-bold"
  );
});

test("resolves conflicting padding shorthand vs directional", () => {
  expect(cn("px-4", "p-2")).toBe("p-2");
});
