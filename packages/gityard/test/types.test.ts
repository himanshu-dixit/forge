/**
 * Tests for type definitions
 */

import { describe, it, expect } from "bun:test";
import type { Worktree, GityardConfig, CLIOptions } from "../src/types";

describe("Type definitions", () => {
  it("should allow Worktree interface", () => {
    const worktree: Worktree = {
      path: "/path/to/worktree",
      branch: "feature-branch",
      commit: "abc123def456789",
      isBare: false,
      isDetached: false,
    };

    expect(worktree.path).toBe("/path/to/worktree");
    expect(worktree.branch).toBe("feature-branch");
    expect(worktree.commit).toBe("abc123def456789");
    expect(worktree.isBare).toBe(false);
    expect(worktree.isDetached).toBe(false);
  });

  it("should allow Worktree without optional fields", () => {
    const worktree: Worktree = {
      path: "/path/to/worktree",
      branch: "main",
      commit: "abc123def456789",
    };

    expect(worktree.path).toBe("/path/to/worktree");
    expect(worktree.branch).toBe("main");
    expect(worktree.commit).toBe("abc123def456789");
    expect(worktree.isBare).toBeUndefined();
    expect(worktree.isDetached).toBeUndefined();
  });

  it("should allow GityardConfig interface", () => {
    const config: GityardConfig = {
      scripts: {
        test: "bun test",
        build: "bun run build",
        dev: ["bun run dev", "bun run watch"],
      },
    };

    expect(config.scripts.test).toBe("bun test");
    expect(config.scripts.build).toBe("bun run build");
    expect(Array.isArray(config.scripts.dev)).toBe(true);
  });

  it("should allow CLIOptions interface", () => {
    const options: CLIOptions = {
      command: "list",
      args: [],
      flags: { verbose: true },
    };

    expect(options.command).toBe("list");
    expect(options.args).toEqual([]);
    expect(options.flags.verbose).toBe(true);
  });

  it("should allow CLIOptions with string flags", () => {
    const options: CLIOptions = {
      command: "switch",
      args: ["feature-branch"],
      flags: { branch: "main", force: true },
    };

    expect(options.command).toBe("switch");
    expect(options.args).toEqual(["feature-branch"]);
    expect(options.flags.branch).toBe("main");
    expect(options.flags.force).toBe(true);
  });

  it("should allow empty CLIOptions", () => {
    const options: CLIOptions = {
      command: "list",
      args: [],
      flags: {},
    };

    expect(options.command).toBe("list");
    expect(options.args).toEqual([]);
    expect(Object.keys(options.flags).length).toBe(0);
  });
});
