/**
 * Remove worktree command
 */

import chalk from "chalk";
import { execGit, parseWorktreeList } from "../utils/git";
import { getWorktreeName } from "../utils/worktree";

/**
 * Remove a worktree by name or path
 * @param nameOrPath Worktree name or path
 * @param force Force removal even if worktree has modified or untracked files
 * @returns Success status
 */
export async function rmWorktree(nameOrPath: string, force: boolean = false): Promise<boolean> {
  const worktrees = await parseWorktreeList();

  // Find worktree by name or path
  const worktree = worktrees.find(
    (wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath
  );

  if (!worktree) {
    throw new Error(`Worktree not found: ${nameOrPath}`);
  }

  // Remove worktree
  const { exitCode, stderr } = await execGit(["worktree", "remove", worktree.path, ...(force ? ["--force"] : [])]);

  if (exitCode !== 0) {
    throw new Error(`Failed to remove worktree: ${stderr}`);
  }

  return true;
}

/**
 * Remove worktree and print to console (CLI mode)
 */
export async function rmWorktreeCLI(nameOrPath: string, force: boolean = false): Promise<void> {
  try {
    await rmWorktree(nameOrPath, force);
    console.log(chalk.green(`🛤️ Removed worktree: ${chalk.cyan(nameOrPath)}`));
  } catch (error: any) {
    console.error(chalk.red(`Error removing worktree: ${error.message}`));
    if (error.message.includes("modified or untracked files") && !force) {
      console.log(chalk.yellow(`\n💡 Tip: Use --force to remove worktrees with modified or untracked files`));
    }
    process.exit(1);
  }
}
