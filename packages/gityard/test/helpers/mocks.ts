/**
 * Helper functions for mocking git utilities in tests
 */

import { mock } from "bun:test";

/**
 * Create a complete mock for the git module with all required exports
 * This prevents issues with module caching when tests run together
 */
export function createGitMock(overrides: Record<string, any> = {}) {
  return {
    execGit: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0 })),
    parseWorktreeList: mock(() => Promise.resolve([])),
    getMainWorktreePath: mock(() => Promise.resolve("/path/to/repo")),
    branchExistsLocally: mock(() => Promise.resolve(false)),
    branchExistsRemotely: mock(() => Promise.resolve(false)),
    listBranches: mock(() => Promise.resolve({ local: [], remote: [] })),
    ...overrides,
  };
}

/**
 * Mock the git module with complete exports
 */
export function mockGitModule(overrides: Record<string, any> = {}) {
  mock.module("../src/utils/git", () => createGitMock(overrides));
}
