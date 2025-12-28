/**
 * Tests for list command
 */

import { describe, it, expect, mock } from "bun:test";
import { listWorktrees } from "../../src/commands/list";
import { createGitMock } from "../helpers/mocks";

describe("listWorktrees", () => {
  it("should return array of worktrees", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/main",
        branch: "main",
        commit: "abc123def456789",
        isDetached: false,
      },
      {
        path: "/path/to/feature",
        branch: "feature-branch",
        commit: "def456ghi789012",
        isDetached: false,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
      })
    );

    const worktrees = await listWorktrees();
    expect(Array.isArray(worktrees)).toBe(true);
    expect(worktrees.length).toBeGreaterThan(0);
    expect(worktrees[0]).toHaveProperty("path");
    expect(worktrees[0]).toHaveProperty("branch");
    expect(worktrees[0]).toHaveProperty("commit");
  });

  it("should return empty array when no worktrees exist", async () => {
    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
      })
    );

    const worktrees = await listWorktrees();
    expect(worktrees).toEqual([]);
  });

  it("should propagate errors from parseWorktreeList", async () => {
    const mockParseWorktreeList = mock(() => Promise.reject(new Error("Failed to list worktrees")));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
      })
    );

    await expect(listWorktrees()).rejects.toThrow("Failed to list worktrees");
  });

  it("should handle worktree with detached HEAD", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/worktree",
        branch: "HEAD",
        commit: "abc123def456789",
        isDetached: true,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
      })
    );

    const worktrees = await listWorktrees();
    expect(worktrees[0].isDetached).toBe(true);
    expect(worktrees[0].branch).toBe("HEAD");
  });

  it("should handle bare repository", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/bare",
        branch: "",
        commit: "abc123def456789",
        isBare: true,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
      })
    );

    const worktrees = await listWorktrees();
    expect(worktrees[0].isBare).toBe(true);
  });
});
