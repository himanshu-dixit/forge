/**
 * Tests for rm command
 */

import { describe, it, expect, mock } from "bun:test";
import { rmWorktree } from "../../src/commands/rm";

describe("rmWorktree", () => {
  it("should remove worktree by path", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/worktree",
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockExecGit = mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 }));
    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mockExecGit,
    }));

    const success = await rmWorktree("/path/to/worktree");
    expect(success).toBe(true);
  });

  it("should remove worktree by name", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/feature",
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockExecGit = mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 }));
    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mockExecGit,
    }));

    const success = await rmWorktree("feature");
    expect(success).toBe(true);
  });

  it("should throw error when worktree not found", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/worktree",
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })),
    }));

    await expect(rmWorktree("non-existent")).rejects.toThrow("Worktree not found: non-existent");
  });

  it("should throw error when git worktree remove fails", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/worktree",
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockExecGit = mock(() => Promise.resolve({ stdout: "", stderr: "fatal: worktree has untracked files", exitCode: 1 }));
    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mockExecGit,
    }));

    await expect(rmWorktree("/path/to/worktree")).rejects.toThrow("Failed to remove worktree: fatal: worktree has untracked files");
  });

  it("should handle empty worktree list", async () => {
    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })),
    }));

    await expect(rmWorktree("any-worktree")).rejects.toThrow("Worktree not found: any-worktree");
  });
});