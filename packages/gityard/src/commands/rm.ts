/**
 * Remove worktree command
 */

import chalk from "chalk";
import { execGit, parseWorktreeList } from "../utils/git";
import { getWorktreeName } from "../utils/worktree";

/**
 * Remove a worktree by name or path
 * @param nameOrPath Worktree name or path
 * @returns Success status
 */
export async function rmWorktree(nameOrPath: string): Promise<boolean> {
  const worktrees = await parseWorktreeList();

  // Find worktree by name or path
  const worktree = worktrees.find(
    (wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath
  );

  if (!worktree) {
    throw new Error(`Worktree not found: ${nameOrPath}`);
  }

  // Remove worktree
  const { exitCode, stderr } = await execGit(["worktree", "remove", worktree.path]);

  if (exitCode !== 0) {
    throw new Error(`Failed to remove worktree: ${stderr}`);
  }

  return true;
}

/**
 * Remove worktree and print to console (CLI mode)
 */
export async function rmWorktreeCLI(nameOrPath: string): Promise<void> {
  try {
    await rmWorktree(nameOrPath);
    console.log(chalk.green(`🛤️ Removed worktree: ${chalk.cyan(nameOrPath)}`));
  } catch (error: any) {
    console.error(chalk.red(`Error removing worktree: ${error.message}`));
    process.exit(1);
  }
}
