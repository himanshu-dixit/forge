/**
 * Tests for switch command
 */

import { describe, it, expect, mock } from "bun:test";
import inquirer from "inquirer";
import { createGitMock } from "../helpers/mocks";

describe("switchWorktree", () => {
  it("should return path when worktree exists", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/worktree",
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    const path = await switchWorktree("worktree");
    expect(path).toBe("/path/to/worktree");
  });

  it("should return path when worktree exists by full path", async () => {
    const mockWorktrees = [
      {
        path: "/path/to/worktree",
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    const path = await switchWorktree("/path/to/worktree");
    expect(path).toBe("/path/to/worktree");
  });

  it("should create worktree when it doesn't exist", async () => {
    const mockExecGit = mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 }));
    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
        execGit: mockExecGit,
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    const path = await switchWorktree("new-worktree", "feature-branch");
    expect(path).toBe("new-worktree");
  });

  it("should use nameOrPath as branch when branch not provided", async () => {
    let capturedArgs: string[] = [];

    const mockExecGit = mock((args: string[]) => {
      capturedArgs = args;
      return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 });
    });

    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
        execGit: mockExecGit,
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    const path = await switchWorktree("new-worktree");
    expect(path).toBe("new-worktree");
    expect(capturedArgs).toEqual(["worktree", "add", "-b", "new-worktree", "new-worktree"]); // Creates new branch since it doesn't exist
  });

  it("should throw error for invalid worktree path", async () => {
    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    await expect(switchWorktree("../invalid-path")).rejects.toThrow("Invalid worktree path: ../invalid-path");
  });

  it("should throw error when git worktree add fails", async () => {
    const mockExecGit = mock(() => Promise.resolve({ stdout: "", stderr: "fatal: branch 'non-existent' does not exist", exitCode: 128 }));
    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
        execGit: mockExecGit,
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    await expect(switchWorktree("new-worktree", "non-existent")).rejects.toThrow("Branch 'non-existent' not found. Please check branch name."); // Updated error message format
  });

  it("should create worktree when nameOrPath provided", async () => {
    let capturedArgs: string[] = [];
    const mockExecGit = mock((args: string[]) => {
      capturedArgs = args;
      return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 });
    });
    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
        execGit: mockExecGit,
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    const path = await switchWorktree("./my-feature", "my-branch");
    expect(path).toBe("./my-feature");
    expect(capturedArgs).toEqual(["worktree", "add", "-b", "my-branch", "./my-feature"]);
  });

  it("should use existing local branch when creating worktree", async () => {
    let capturedArgs: string[] = [];

    const mockExecGit = mock((args: string[]) => {
      capturedArgs = args;
      return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 });
    });

    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
        execGit: mockExecGit,
        branchExistsLocally: mock(() => Promise.resolve(true)), // Branch exists locally
        listBranches: mock(() => Promise.resolve({ local: ["my-branch"], remote: [] })),
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    const path = await switchWorktree("./my-feature", "my-branch");
    expect(path).toBe("./my-feature");
    expect(capturedArgs).toEqual(["worktree", "add", "./my-feature", "my-branch"]); // Uses existing branch without -b flag
  });

  it("should checkout remote branch when creating worktree", async () => {
    let capturedArgs: string[] = [];

    const mockExecGit = mock((args: string[]) => {
      capturedArgs = args;
      return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 });
    });

    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () =>
      createGitMock({
        parseWorktreeList: mockParseWorktreeList,
        execGit: mockExecGit,
        branchExistsRemotely: mock(() => Promise.resolve(true)), // Branch exists remotely
        listBranches: mock(() => Promise.resolve({ local: [], remote: ["my-branch"] })),
      })
    );

    const { switchWorktree } = await import("../../src/commands/switch");

    const path = await switchWorktree("./my-feature", "my-branch");
    expect(path).toBe("./my-feature");
    expect(capturedArgs).toEqual(["worktree", "add", "./my-feature", "origin/my-branch"]); // Uses remote branch
  });

});
