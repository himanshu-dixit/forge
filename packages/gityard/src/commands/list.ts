/**
 * List command - List git worktrees
 */

import type { Worktree } from "../types";
import { parseWorktreeList } from "../utils/git";

/**
 * List all worktrees in the current repository.
 */
export async function listWorktrees(): Promise<Worktree[]> {
  return parseWorktreeList();
}
