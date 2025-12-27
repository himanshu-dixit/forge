/**
 * Switch worktree command
 */

import chalk from "chalk";
import { parseWorktreeList, execGit } from "../utils/git";
import { getWorktreeName, isValidWorktreePath } from "../utils/worktree";

/**
 * Switch to a worktree by name or path, creating it if it doesn't exist
 * @param nameOrPath Worktree name or path
 * @param branch Optional branch name (if creating new worktree)
 * @returns Worktree path
 */
export async function switchWorktree(nameOrPath: string, branch?: string): Promise<string> {
  const worktrees = await parseWorktreeList();

  // Find worktree by name or path
  const worktree = worktrees.find(
    (wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath
  );

  if (worktree) {
    return worktree.path;
  }

  // Worktree doesn't exist - create it
  // If branch is provided, use it; otherwise use nameOrPath as branch name
  const branchName = branch || nameOrPath;
  const worktreePath = nameOrPath;

  if (!isValidWorktreePath(worktreePath)) {
    throw new Error(`Invalid worktree path: ${worktreePath}`);
  }

  // Add worktree
  const { exitCode, stderr } = await execGit(["worktree", "add", worktreePath, branchName]);

  if (exitCode !== 0) {
    throw new Error(`Failed to create worktree: ${stderr}`);
  }

  return worktreePath;
}

/**
 * Switch to a worktree and print path (CLI mode)
 */
export async function switchWorktreeCLI(nameOrPath: string, branch?: string): Promise<void> {
  try {
    const worktrees = await parseWorktreeList();
    const existing = worktrees.find(
      (wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath
    );

    const path = await switchWorktree(nameOrPath, branch);
    
    if (existing) {
      console.log(chalk.green(`🛤️ Switched to worktree: ${chalk.cyan(path)}`));
    } else {
      console.log(chalk.green(`🛤️ Created and switched to worktree: ${chalk.cyan(path)}`));
    }
    console.log(chalk.dim(`\nTo change directory, run: ${chalk.bold(`cd ${path}`)}`));
  } catch (error: any) {
    console.error(chalk.red(`Error switching worktree: ${error.message}`));
    process.exit(1);
  }
}
