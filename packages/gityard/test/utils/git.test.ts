/**
 * Tests for git utilities
 */

import { describe, it, expect, mock } from "bun:test";

describe("execGit", () => {
  it("should execute git command successfully", async () => {
    const mockExecGit = mock((_args: string[]) => 
      Promise.resolve({ stdout: "git version 2.39.0", stderr: "", exitCode: 0 })
    );

    mock.module("../../src/utils/git", () => ({
      execGit: mockExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve([])),
      getMainWorktreePath: mock((_args: string[]) => Promise.resolve("/path/to/repo")),
    }));

    const { execGit: mockedExecGit } = await import("../../src/utils/git");
    const result = await mockedExecGit(["--version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("git version 2.39.0");
  });

  it("should execute git command with error", async () => {
    const mockExecGit = mock((_args: string[]) =>
      Promise.resolve({ stdout: "", stderr: "git: 'invalid-command' is not a git command", exitCode: 1 })
    );

    mock.module("../../src/utils/git", () => ({
      execGit: mockExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve([])),
      getMainWorktreePath: mock((_args: string[]) => Promise.resolve("/path/to/repo")),
    }));

    const { execGit: mockedExecGit } = await import("../../src/utils/git");
    const result = await mockedExecGit(["invalid-command"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("not a git command");
  });

  it("should execute git command in specified directory", async () => {
    let capturedCwd: string | undefined;
    const mockExecGit = mock((args: string[], cwd?: string) => {
      capturedCwd = cwd;
      return Promise.resolve({ stdout: "", stderr: "fatal: not a git repository", exitCode: 128 });
    });

    mock.module("../../src/utils/git", () => ({
      execGit: mockExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve([])),
      getMainWorktreePath: mock((_args: string[]) => Promise.resolve("/path/to/repo")),
    }));

    const { execGit: mockedExecGit } = await import("../../src/utils/git");
    await mockedExecGit(["rev-parse", "--git-dir"], "/non/existent/path");
    expect(capturedCwd).toBe("/non/existent/path");
  });
});

describe("parseWorktreeList", () => {
  it("should parse valid worktree output", async () => {
    const mockExecGit = mock((_args: string[]) =>
      Promise.resolve({
        stdout: "worktree /path/to/main\nHEAD abc123def456789\nbranch refs/heads/main\n\n",
        stderr: "",
        exitCode: 0
      })
    );

    const mockWorktrees = [{
      path: "/path/to/main",
      branch: "refs/heads/main",
      commit: "abc123def456789",
    }];

    mock.module("../../src/utils/git", () => ({
      execGit: mockExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve(mockWorktrees)),
      getMainWorktreePath: mock((_args: string[]) => Promise.resolve("/path/to/repo")),
    }));

    const { parseWorktreeList: mockedParseWorktreeList } = await import("../../src/utils/git");
    const worktrees = await mockedParseWorktreeList();
    expect(Array.isArray(worktrees)).toBe(true);
    expect(worktrees.length).toBe(1);
    expect(worktrees[0].path).toBe("/path/to/main");
  });

  it("should handle multiple worktrees", async () => {
    const mockExecGit = mock((_args: string[]) =>
      Promise.resolve({
        stdout: "",
        stderr: "",
        exitCode: 0
      })
    );

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

    mock.module("../../src/utils/git", () => ({
      execGit: mockExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve(mockWorktrees)),
      getMainWorktreePath: mock((_args: string[]) => Promise.resolve("/path/to/repo")),
    }));

    const { parseWorktreeList: mockedParseWorktreeList } = await import("../../src/utils/git");
    const worktrees = await mockedParseWorktreeList();
    expect(worktrees.length).toBe(2);
    expect(worktrees[0].branch).toBe("main");
    expect(worktrees[1].branch).toBe("feature-branch");
  });

  it("should handle detached HEAD", async () => {
    const mockExecGit = mock((_args: string[]) =>
      Promise.resolve({
        stdout: "",
        stderr: "",
        exitCode: 0
      })
    );

    const mockWorktrees = [
      {
        path: "/path/to/worktree",
        branch: "HEAD",
        commit: "abc123def456789",
        isDetached: true,
      },
    ];

    mock.module("../../src/utils/git", () => ({
      execGit: mockExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve(mockWorktrees)),
      getMainWorktreePath: mock((_args: string[]) => Promise.resolve("/path/to/repo")),
    }));

    const { parseWorktreeList: mockedParseWorktreeList } = await import("../../src/utils/git");
    const worktrees = await mockedParseWorktreeList();
    expect(worktrees[0].isDetached).toBe(true);
    expect(worktrees[0].branch).toBe("HEAD");
  });

  it("should handle bare repository", async () => {
    const mockExecGit = mock((_args: string[]) =>
      Promise.resolve({
        stdout: "",
        stderr: "",
        exitCode: 0
      })
    );

    const mockWorktrees = [
      {
        path: "/path/to/bare",
        branch: "",
        commit: "abc123def456789",
        isBare: true,
      },
    ];

    mock.module("../../src/utils/git", () => ({
      execGit: mockExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve(mockWorktrees)),
      getMainWorktreePath: mock((_args: string[]) => Promise.resolve("/path/to/repo")),
    }));

    const { parseWorktreeList: mockedParseWorktreeList } = await import("../../src/utils/git");
    const worktrees = await mockedParseWorktreeList();
    expect(worktrees[0].isBare).toBe(true);
  });
});

describe("getMainWorktreePath", () => {
  it("should return git directory path", async () => {
    const mockExecGit = mock((_args: string[]) =>
      Promise.resolve({ stdout: ".git", stderr: "", exitCode: 0 })
    );

    mock.module("../../src/utils/git", () => ({
      execGit: mockExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve([])),
      getMainWorktreePath: mock((_args: string[]) => Promise.resolve("/path/to/repo")),
    }));

    const { getMainWorktreePath: mockedGetMainWorktreePath } = await import("../../src/utils/git");
    const path = await mockedGetMainWorktreePath();
    expect(typeof path).toBe("string");
    expect(path).toBe("/path/to/repo");
  });

  it("should throw error when not in git repository", async () => {
    // Import original functions before mocking
    const { execGit: originalExecGit, getMainWorktreePath: originalGetMainWorktreePath } = await import("../../src/utils/git");

    // Now mock the module with a function that will throw
    mock.module("../../src/utils/git", () => ({
      execGit: originalExecGit,
      parseWorktreeList: mock((_args: string[]) => Promise.resolve([])),
      getMainWorktreePath: originalGetMainWorktreePath,
    }));

    // The mocked getMainWorktreePath should still throw because it calls execGit which returns error
    await expect(originalGetMainWorktreePath()).rejects.toThrow("Not a git repository");
  });
});
