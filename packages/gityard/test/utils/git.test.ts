/**
 * Tests for git utilities
 */

import { describe, it, expect } from "bun:test";
import { execGit, parseWorktreeList, getMainWorktreePath } from "../../src/utils/git";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("execGit", () => {
  it("should execute git command successfully", async () => {
    const result = await execGit(["--version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/^git version/);
  });

  it("should execute git command with error", async () => {
    const result = await execGit(["invalid-command"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("not a git command");
  });

  it("should execute git command in specified directory", async () => {
    // Create a temporary directory
    const tempDir = await mkdtemp(join(tmpdir(), "gityard-test-"));
    
    try {
      const result = await execGit(["rev-parse", "--git-dir"], tempDir);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("not a git repository");
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });
});

describe("parseWorktreeList", () => {
  it("should parse valid worktree output", async () => {
    // This test will only pass if run in a git repository
    const worktrees = await parseWorktreeList();
    expect(Array.isArray(worktrees)).toBe(true);
    
    if (worktrees.length > 0) {
      const wt = worktrees[0];
      expect(wt).toHaveProperty("path");
      expect(wt).toHaveProperty("commit");
      expect(wt).toHaveProperty("branch");
    }
  });

  it("should throw error when git command fails", async () => {
    // Create a temporary directory to simulate a non-git directory
    const tempDir = await mkdtemp(join(tmpdir(), "gityard-test-"));

    try {
      // Try to run parseWorktreeList from a non-git directory
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        await parseWorktreeList();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe("Failed to list worktrees");
      } finally {
        process.chdir(originalCwd);
      }
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });
});

describe("getMainWorktreePath", () => {
  it("should return git directory path", async () => {
    // This test will only pass if run in a git repository
    const path = await getMainWorktreePath();
    expect(typeof path).toBe("string");
    expect(path.length).toBeGreaterThan(0);
  });

  it("should throw error when not in git repository", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "gityard-test-"));

    try {
      // Try to get main worktree path from a non-git directory
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        await getMainWorktreePath();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe("Not a git repository");
      } finally {
        process.chdir(originalCwd);
      }
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });
});
