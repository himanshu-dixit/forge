/**
 * List worktrees command
 */

import chalk from "chalk";
import { parseWorktreeList, getMainWorktreePath } from "../utils/git";
import { formatWorktree } from "../utils/worktree";
import { loadConfig } from "../config";
import type { Worktree } from "../types";

/**
 * List all worktrees
 * @param cwd Optional working directory (repository root)
 * @returns Array of worktree objects
 */
export async function listWorktrees(cwd?: string): Promise<Worktree[]> {
  return await parseWorktreeList(cwd);
}

/**
 * List worktrees and print to console (CLI mode)
 * @param path Optional path to the repository
 */
export async function listWorktreesCLI(path?: string): Promise<void> {
  try {
    // If a path is provided, use it as the base directory
    const startDir = path || process.cwd();
    
    // Get the main worktree path (repository root) first
    // This ensures we're listing worktrees from the correct repository
    const repoRoot = await getMainWorktreePath(startDir);
    const worktrees = await listWorktrees(repoRoot);

    if (worktrees.length === 0) {
      console.log(chalk.yellow("No worktrees found."));
      return;
    }

    // Load config for formatting
    const config = await loadConfig(repoRoot);
    const basePath = config?.gitforge;

    console.log(chalk.bold("🛤️ Worktrees:"));
    for (const worktree of worktrees) {
      console.log(`  ${chalk.cyan(formatWorktree(worktree, basePath))}`);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error listing worktrees: ${error.message}`));
    process.exit(1);
  }
}
