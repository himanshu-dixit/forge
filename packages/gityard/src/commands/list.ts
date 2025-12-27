/**
 * List worktrees command
 */

import chalk from "chalk";
import { parseWorktreeList } from "../utils/git";
import { formatWorktree } from "../utils/worktree";
import type { Worktree } from "../types";

/**
 * List all worktrees
 * @returns Array of worktree objects
 */
export async function listWorktrees(): Promise<Worktree[]> {
  return await parseWorktreeList();
}

/**
 * List worktrees and print to console (CLI mode)
 */
export async function listWorktreesCLI(): Promise<void> {
  try {
    const worktrees = await listWorktrees();

    if (worktrees.length === 0) {
      console.log(chalk.yellow("No worktrees found."));
      return;
    }

    console.log(chalk.bold("🛤️ Worktrees:"));
    for (const worktree of worktrees) {
      console.log(`  ${chalk.cyan(formatWorktree(worktree))}`);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error listing worktrees: ${error.message}`));
    process.exit(1);
  }
}
