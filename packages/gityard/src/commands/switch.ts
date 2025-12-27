/**
 * Switch worktree command
 */

import chalk from "chalk";
import inquirer from "inquirer";
import { parseWorktreeList, execGit } from "../utils/git";
import { getWorktreeName, isValidWorktreePath } from "../utils/worktree";

/**
 * Interactive prompt to select a worktree
 */
async function promptWorktreeSelection(): Promise<string> {
  const worktrees = await parseWorktreeList();

  // Format worktrees for inquirer
  const choices = worktrees.map((worktree) => {
    const worktreeName = getWorktreeName(worktree.path);
    const branchInfo = worktree.branch ? chalk.dim(`(${worktree.branch})`) : chalk.dim("(detached HEAD)");
    return {
      name: `${worktreeName} ${branchInfo}`,
      value: worktree.path,
    };
  });

  // Add "Create a new worktree" option at the top
  choices.unshift({
    name: chalk.green("+ Create a new worktree"),
    value: "__CREATE_NEW__",
  });

  console.log(chalk.bold("\n🛤️ Available worktrees:\n"));

  // Use inquirer for interactive selection
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "worktree",
      message: "Select a worktree to switch to:",
      choices,
      pageSize: 10,
    },
  ]);

  // If user selected "Create a new worktree", prompt for details
  if (answers.worktree === "__CREATE_NEW__") {
    const newAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "path",
        message: "Enter worktree path (e.g., ./my-feature):",
        validate: (input: string) => {
          if (!input || input.trim() === "") {
            return "Path cannot be empty";
          }
          if (!isValidWorktreePath(input)) {
            return "Invalid worktree path";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "branch",
        message: "Enter branch name (optional, defaults to path):",
        default: (answers: any) => {
          const path = answers.path;
          // Use the last part of the path as default branch name
          return path.split("/").pop()?.replace(/^\.\//, "") || path;
        },
      },
    ]);

    const worktreePath = newAnswers.path;
    const branchName = newAnswers.branch || newAnswers.path;

    // Add worktree
    const { exitCode, stderr } = await execGit(["worktree", "add", worktreePath, branchName]);

    if (exitCode !== 0) {
      throw new Error(`Failed to create worktree: ${stderr}`);
    }

    console.log(chalk.green(`🛤️ Created new worktree: ${chalk.cyan(worktreePath)}`));
    return worktreePath;
  }

  return answers.worktree;
}

/**
 * Switch to a worktree by name or path, creating it if it doesn't exist
 * @param nameOrPath Worktree name or path (optional - will prompt if not provided)
 * @param branch Optional branch name (if creating new worktree)
 * @returns Worktree path
 */
export async function switchWorktree(nameOrPath?: string, branch?: string): Promise<string> {
  const worktrees = await parseWorktreeList();

  // If no nameOrPath provided, prompt for selection
  if (!nameOrPath) {
    return await promptWorktreeSelection();
  }

  // If nameOrPath is empty string, throw error
  if (nameOrPath.trim() === "") {
    throw new Error("Invalid worktree path: ");
  }

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
export async function switchWorktreeCLI(nameOrPath?: string, branch?: string, cdMode?: boolean): Promise<void> {
  try {
    const worktrees = await parseWorktreeList();
    const existing = nameOrPath
      ? worktrees.find((wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath)
      : null;

    const path = await switchWorktree(nameOrPath, branch);

    if (cdMode) {
      // In cd mode, output a cd command for use with eval
      console.log(`cd "${path}"`);
      return;
    }

    if (existing || !nameOrPath) {
      console.log(chalk.green(`🛤️ Switched to worktree: ${chalk.cyan(path)}`));
    } else {
      console.log(chalk.green(`🛤️ Created and switched to worktree: ${chalk.cyan(path)}`));
    }
    console.log(chalk.dim(`\nTo change directory, run: ${chalk.bold(`cd ${path}`)}`));
    console.log(chalk.dim(`Or auto-cd: ${chalk.bold(`eval "$(gityard switch --cd ${nameOrPath})`)}`));
  } catch (error: any) {
    console.error(chalk.red(`Error switching worktree: ${error.message}`));
    process.exit(1);
  }
}
