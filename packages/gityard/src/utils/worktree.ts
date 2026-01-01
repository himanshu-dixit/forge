/**
 * Worktree utilities and validation
 */

import { relative, resolve } from "path";
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
  if (!path) return "";
  // Remove trailing slashes
  const normalizedPath = path.replace(/\/+$/, "");
  const parts = normalizedPath.split("/");
  return parts[parts.length - 1] || normalizedPath;
}

/**
 * Get relative worktree name from base path
 * When basePath is provided, returns only the directory name (relative to basePath)
 */
export function getRelativeWorktreeName(worktreePath: string, basePath?: string): string {
  if (!basePath) {
    return getWorktreeName(worktreePath);
  }
  
  try {
    const resolvedBase = resolve(basePath);
    const resolvedWorktree = resolve(worktreePath);
    
    // If worktree path is the same as base path, return the directory name
    if (resolvedBase === resolvedWorktree) {
      return getWorktreeName(worktreePath);
    }
    
    // Check if worktree is within base path
    if (resolvedWorktree.startsWith(resolvedBase + "/")) {
      const relativePath = relative(resolvedBase, resolvedWorktree);
      // Extract just the first part (directory name) if it's nested
      const parts = relativePath.split("/");
      return parts[0] || getWorktreeName(worktreePath);
    }
    
    // Worktree is outside base path, return just the name
    return getWorktreeName(worktreePath);
  } catch {
    // Fallback to just the name if path resolution fails
    return getWorktreeName(worktreePath);
  }
}

/**
 * Format worktree for display
 */
export function formatWorktree(worktree: Worktree, basePath?: string): string {
  const status = worktree.isDetached ? " (detached)" : "";
  const displayPath = getRelativeWorktreeName(worktree.path, basePath);
  const commitHash = worktree.commit ? ` [${worktree.commit.substring(0, 7)}]` : "";
  return `${displayPath} ${worktree.branch}${status}${commitHash}`;
}
