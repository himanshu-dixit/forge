/**
 * Worktree utilities and validation
 */

import type { Worktree } from "../types";

/**
 * Validate worktree path
 */
export function isValidWorktreePath(path: string): boolean {
  return path.length > 0 && !path.includes("..");
}

/**
 * Parse worktree name from path
 */
export function getWorktreeName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

/**
 * Format worktree for display
 */
export function formatWorktree(worktree: Worktree): string {
  const status = worktree.isDetached ? " (detached)" : "";
  return `${worktree.path} ${worktree.branch}${status} [${worktree.commit.substring(0, 7)}]`;
}
