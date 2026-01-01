/**
 * Switch worktree command
 */

import chalk from "chalk";
import inquirer from "inquirer";
import { parseWorktreeList, execGit, branchExistsLocally, branchExistsRemotely, getMainWorktreePath } from "../utils/git";
import { getWorktreeName, isValidWorktreePath } from "../utils/worktree";
import { existsSync } from "fs";
import { loadConfig } from "../config";
import { runScriptByName } from "./run";

type SwitchResult = {
  path: string;
  created: boolean;
};

async function runHookScripts(
  hookScripts: string | string[] | undefined,
  worktreePath: string,
  repoRoot: string
): Promise<void> {
  if (!hookScripts) {
    return;
  }

  const scripts = Array.isArray(hookScripts) ? hookScripts : [hookScripts];
  for (const scriptName of scripts) {
    await runScriptByName(worktreePath, scriptName, repoRoot);
  }
}

/**
 * Create a new worktree with smart branch handling
 */
async function createWorktree(path: string, branch: string): Promise<string> {
  // Check if path already exists
  if (existsSync(path)) {
    throw new Error(`Path already exists: ${path}. Please choose a different path or remove the existing directory.`);
  }

  // Check if branch exists
  const existsLocally = await branchExistsLocally(branch);
  const existsRemotely = await branchExistsRemotely(branch);

  if (existsLocally || existsRemotely) {
    // Branch exists, use it directly
    const branchRef = existsLocally ? branch : `origin/${branch}`;
    console.log(chalk.blue(`Using existing branch: ${chalk.cyan(branch)}`));
    const { exitCode, stderr } = await execGit(["worktree", "add", path, branchRef]);
    
    if (exitCode !== 0) {
      // Check for common errors
      if (stderr.includes("already contains a worktree")) {
        throw new Error(`The path "${path}" is already part of a worktree. Use a different path.`);
      }
      if (stderr.includes("no such ref")) {
        throw new Error(`Branch "${branch}" not found. Please check the branch name.`);
      }
      throw new Error(`Failed to create worktree: ${stderr}`);
    }
  } else {
    // Branch doesn't exist, create new branch
    console.log(chalk.blue(`Creating new branch: ${chalk.cyan(branch)}`));
    const { exitCode, stderr } = await execGit(["worktree", "add", "-b", branch, path]);
    
    if (exitCode !== 0) {
      // Check for common errors
      if (stderr.includes("already contains a worktree")) {
        throw new Error(`The path "${path}" is already part of a worktree. Use a different path.`);
      }
      if (stderr.includes("invalid branch name")) {
        throw new Error(`Invalid branch name: "${branch}". Please use a valid branch name.`);
      }
      if (stderr.includes("no such ref") || stderr.includes("does not exist")) {
        throw new Error(`Branch '${branch}' not found. Please check branch name.`);
      }
      throw new Error(`Failed to create worktree and branch: ${stderr}`);
    }
  }

  return path;
}

/**
 * Interactive prompt to select a worktree
 */
async function promptWorktreeSelection(): Promise<SwitchResult> {
  const repoRoot = await getMainWorktreePath();
  const worktrees = await parseWorktreeList(repoRoot);

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

    // Create worktree using smart branch handling
    await createWorktree(worktreePath, branchName);

    console.log(chalk.green(`🛤️ Created new worktree: ${chalk.cyan(worktreePath)}`));
    return { path: worktreePath, created: true };
  }

  return { path: answers.worktree, created: false };
}

/**
 * Switch to a worktree by name or path, creating it if it doesn't exist
 * @param nameOrPath Worktree name or path (optional - will prompt if not provided)
 * @param branch Optional branch name (if creating new worktree)
 * @returns Worktree path
 */
export async function switchWorktree(nameOrPath?: string, branch?: string): Promise<SwitchResult> {
  const repoRoot = await getMainWorktreePath();
  const worktrees = await parseWorktreeList(repoRoot);

  // If no nameOrPath provided, prompt for selection
  if (!nameOrPath) {
    const result = await promptWorktreeSelection();
    if (result.created) {
      const config = await loadConfig(repoRoot);
      await runHookScripts(config?.hooks?.onCreate, result.path, repoRoot);
    }
    return result;
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
    return { path: worktree.path, created: false };
  }

  // Worktree doesn't exist - create it
  // If branch is provided, use it; otherwise use nameOrPath as branch name
  const branchName = branch || nameOrPath;
  const worktreePath = nameOrPath;

  if (!isValidWorktreePath(worktreePath)) {
    throw new Error(`Invalid worktree path: ${worktreePath}`);
  }

  // Create worktree using smart branch handling
  await createWorktree(worktreePath, branchName);

  const config = await loadConfig(repoRoot);
  await runHookScripts(config?.hooks?.onCreate, worktreePath, repoRoot);

  return { path: worktreePath, created: true };
}

/**
 * Switch to a worktree and print path (CLI mode)
 */
export async function switchWorktreeCLI(nameOrPath?: string, branch?: string, cdMode?: boolean): Promise<void> {
  try {
    const repoRoot = await getMainWorktreePath();
    const worktrees = await parseWorktreeList(repoRoot);
    const existing = nameOrPath
      ? worktrees.find((wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath)
      : null;

    const result = await switchWorktree(nameOrPath, branch);
    const path = result.path;

    if (cdMode) {
      // In cd mode, output a cd command for use with eval
      console.log(`cd "${path}"`);
      return;
    }

    if (existing || !result.created) {
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
