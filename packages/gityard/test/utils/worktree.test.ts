/**
 * Tests for worktree utilities
 */

import { describe, it, expect } from "bun:test";
import { isValidWorktreePath, getWorktreeName, formatWorktree } from "../../src/utils/worktree";
import type { Worktree } from "../../src/types";

describe("isValidWorktreePath", () => {
  it("should validate valid paths", () => {
    expect(isValidWorktreePath("feature-branch")).toBe(true);
    expect(isValidWorktreePath("path/to/branch")).toBe(true);
    expect(isValidWorktreePath("my-worktree")).toBe(true);
  });

  it("should invalidate empty path", () => {
    expect(isValidWorktreePath("")).toBe(false);
  });

  it("should invalidate paths with parent directory references", () => {
    expect(isValidWorktreePath("../branch")).toBe(false);
    expect(isValidWorktreePath("path/../branch")).toBe(false);
    expect(isValidWorktreePath("path/../../branch")).toBe(false);
  });
});

describe("getWorktreeName", () => {
  it("should extract name from simple path", () => {
    expect(getWorktreeName("feature-branch")).toBe("feature-branch");
    expect(getWorktreeName("my-worktree")).toBe("my-worktree");
  });

  it("should extract name from nested path", () => {
    expect(getWorktreeName("path/to/feature")).toBe("feature");
    expect(getWorktreeName("src/worktree/test")).toBe("test");
  });

  it("should return last component for paths with trailing slash", () => {
    expect(getWorktreeName("path/to/feature/")).toBe("path/to/feature/");
  });

  it("should handle single character paths", () => {
    expect(getWorktreeName("a")).toBe("a");
  });
});

describe("formatWorktree", () => {
  it("should format worktree with branch", () => {
    const worktree: Worktree = {
      path: "/path/to/worktree",
      branch: "feature-branch",
      commit: "abc123def456789",
      isDetached: false,
    };

    const formatted = formatWorktree(worktree);
    expect(formatted).toBe("/path/to/worktree feature-branch [abc123d]");
  });

  it("should format worktree with detached HEAD", () => {
    const worktree: Worktree = {
      path: "/path/to/worktree",
      branch: "HEAD",
      commit: "abc123def456789",
      isDetached: true,
    };

    const formatted = formatWorktree(worktree);
    expect(formatted).toBe("/path/to/worktree HEAD (detached) [abc123d]");
  });

  it("should format worktree with 7-char commit hash", () => {
    const worktree: Worktree = {
      path: "/path/to/worktree",
      branch: "main",
      commit: "a1b2c3d4e5f6g7h8",
      isDetached: false,
    };

    const formatted = formatWorktree(worktree);
    expect(formatted).toContain("[a1b2c3d]");
  });

  it("should handle short commit hash", () => {
    const worktree: Worktree = {
      path: "/path/to/worktree",
      branch: "main",
      commit: "abc123",
      isDetached: false,
    };

    const formatted = formatWorktree(worktree);
    expect(formatted).toContain("[abc123]");
  });
});
