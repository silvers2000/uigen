import { test, expect, beforeEach } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

beforeEach(() => {
  sessionStorage.clear();
});

// setHasAnonWork

test("setHasAnonWork stores data when messages are present", () => {
  setHasAnonWork([{ role: "user", content: "Hello" }], {});
  expect(getHasAnonWork()).toBe(true);
});

test("setHasAnonWork stores data when fileSystem has more than root entry", () => {
  setHasAnonWork([], { "/": {}, "/App.jsx": "code" });
  expect(getHasAnonWork()).toBe(true);
});

test("setHasAnonWork does not store when messages are empty and fileSystem has only root", () => {
  setHasAnonWork([], { "/": {} });
  expect(getHasAnonWork()).toBe(false);
});

test("setHasAnonWork does not store when both are empty", () => {
  setHasAnonWork([], {});
  expect(getHasAnonWork()).toBe(false);
});

// getHasAnonWork

test("getHasAnonWork returns false when nothing is stored", () => {
  expect(getHasAnonWork()).toBe(false);
});

test("getHasAnonWork returns true after setHasAnonWork saves data", () => {
  setHasAnonWork([{ role: "user", content: "test" }], {});
  expect(getHasAnonWork()).toBe(true);
});

// getAnonWorkData

test("getAnonWorkData returns null when nothing is stored", () => {
  expect(getAnonWorkData()).toBeNull();
});

test("getAnonWorkData returns stored messages and fileSystemData", () => {
  const messages = [{ role: "user", content: "Create a button" }];
  const fileSystemData = { "/": {}, "/App.jsx": "export default () => <div/>" };
  setHasAnonWork(messages, fileSystemData);

  const result = getAnonWorkData();
  expect(result).not.toBeNull();
  expect(result?.messages).toEqual(messages);
  expect(result?.fileSystemData).toEqual(fileSystemData);
});

test("getAnonWorkData returns null when stored JSON is invalid", () => {
  sessionStorage.setItem("uigen_anon_data", "not-valid-json{{{");
  expect(getAnonWorkData()).toBeNull();
});

// clearAnonWork

test("clearAnonWork removes stored data", () => {
  setHasAnonWork([{ role: "user", content: "test" }], {});
  expect(getHasAnonWork()).toBe(true);

  clearAnonWork();

  expect(getHasAnonWork()).toBe(false);
  expect(getAnonWorkData()).toBeNull();
});

test("clearAnonWork is a no-op when nothing is stored", () => {
  expect(() => clearAnonWork()).not.toThrow();
  expect(getHasAnonWork()).toBe(false);
});
