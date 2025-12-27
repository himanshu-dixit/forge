/**
 * Tests for run command
 */

import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { runScript } from "../../src/commands/run";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("runScript", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gityard-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("should run single command script", async () => {
    const mockWorktrees = [
      {
        path: tempDir,
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({
      scripts: {
        test: "echo 'test passed'",
      },
    });
    await writeFile(configPath, configContent, "utf-8");

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));
    const mockGetScript = mock(() => Promise.resolve("echo 'test passed'"));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })),
    }));

    mock.module("../../src/config", () => ({
      getScript: mockGetScript,
      loadConfig: mock(() => Promise.resolve({ scripts: { test: "echo 'test passed'" } })),
    }));

    const success = await runScript(tempDir, "test");
    expect(success).toBe(true);
  });

  it("should run array of commands", async () => {
    const mockWorktrees = [
      {
        path: tempDir,
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));
    const mockGetScript = mock(() => Promise.resolve(["echo 'first'", "echo 'second'"]));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })),
    }));

    mock.module("../../src/config", () => ({
      getScript: mockGetScript,
      loadConfig: mock(() => Promise.resolve({ scripts: { test: ["echo 'first'", "echo 'second'"] } })),
    }));

    const success = await runScript(tempDir, "test");
    expect(success).toBe(true);
  });

  it("should throw error when worktree not found", async () => {
    const mockParseWorktreeList = mock(() => Promise.resolve([]));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })),
    }));

    await expect(runScript("non-existent", "test")).rejects.toThrow("Worktree not found: non-existent");
  });

  it("should throw error when script not found", async () => {
    const mockWorktrees = [
      {
        path: tempDir,
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({
      scripts: {
        test: "echo 'test passed'",
      },
    });
    await writeFile(configPath, configContent, "utf-8");

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));
    const mockGetScript = mock(() => Promise.resolve(null));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })),
    }));

    mock.module("../../src/config", () => ({
      getScript: mockGetScript,
      loadConfig: mock(() => Promise.resolve({ scripts: { test: "echo 'test passed'" } })),
    }));

    await expect(runScript(tempDir, "non-existent-script")).rejects.toThrow("Script not found: non-existent-script");
  });

  it("should execute git commands specially", async () => {
    const mockWorktrees = [
      {
        path: tempDir,
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));
    const mockGetScript = mock(() => Promise.resolve("git status"));
    const mockExecGit = mock(() => Promise.resolve({ stdout: "On branch feature-branch", stderr: "", exitCode: 0 }));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mockExecGit,
    }));

    mock.module("../../src/config", () => ({
      getScript: mockGetScript,
      loadConfig: mock(() => Promise.resolve({ scripts: { status: "git status" } })),
    }));

    const success = await runScript(tempDir, "status");
    expect(success).toBe(true);
  });

  it("should throw error when command fails", async () => {
    const mockWorktrees = [
      {
        path: tempDir,
        branch: "feature-branch",
        commit: "abc123def456789",
        isDetached: false,
      },
    ];

    const mockParseWorktreeList = mock(() => Promise.resolve(mockWorktrees));
    const mockGetScript = mock(() => Promise.resolve("false"));

    mock.module("../../src/utils/git", () => ({
      parseWorktreeList: mockParseWorktreeList,
      execGit: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })),
    }));

    mock.module("../../src/config", () => ({
      getScript: mockGetScript,
      loadConfig: mock(() => Promise.resolve({ scripts: { fail: "false" } })),
    }));

    await expect(runScript(tempDir, "fail")).rejects.toThrow();
  });
});