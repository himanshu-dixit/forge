/**
 * Run script command
 */

import chalk from "chalk";
import { parseWorktreeList, getMainWorktreePath } from "../utils/git";
import { getWorktreeName } from "../utils/worktree";
import { getScript } from "../config";
import { execGit } from "../utils/git";

/**
 * Run a script in a specific worktree
 * @param worktreeName Worktree name or path
 * @param scriptName Script name from gityard.json
 * @returns Success status
 */
export async function runScript(
  worktreeName: string,
  scriptName: string
): Promise<boolean> {
  // Find worktree
  const repoRoot = await getMainWorktreePath();
  const worktrees = await parseWorktreeList(repoRoot);
  const worktree = worktrees.find(
    (wt) => wt.path === worktreeName || getWorktreeName(wt.path) === worktreeName
  );

  if (!worktree) {
    throw new Error(`Worktree not found: ${worktreeName}`);
  }

  // Load script from config
  const script = await getScript(scriptName, worktree.path);

  if (!script) {
    throw new Error(`Script not found: ${scriptName}`);
  }

  // Execute script
  const commands = Array.isArray(script) ? script : [script];

  for (const cmd of commands) {
    // Split command into parts
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    if (command === "git") {
      // Execute git command
      const { exitCode, stderr } = await execGit(args, worktree.path);
      if (exitCode !== 0) {
        throw new Error(`Script execution failed: ${stderr}`);
      }
    } else {
      // Execute shell command using shell
      const proc = Bun.spawn([command, ...args], {
        cwd: worktree.path,
        stdout: "inherit",
        stderr: "inherit",
        shell: true,
      });

      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        throw new Error(`Script execution failed with exit code ${exitCode}`);
      }
    }
  }

  return true;
}

/**
 * Run script in worktree (CLI mode)
 */
export async function runScriptCLI(worktreeName: string, scriptName: string): Promise<void> {
  try {
    console.log(chalk.blue(`Running script '${chalk.bold(scriptName)}' in worktree '${chalk.cyan(worktreeName)}'...`));
    await runScript(worktreeName, scriptName);
    console.log(chalk.green(`🛤️ Executed script '${chalk.bold(scriptName)}' in worktree '${chalk.cyan(worktreeName)}'`));
  } catch (error: any) {
    console.error(chalk.red(`Error running script: ${error.message}`));
    process.exit(1);
  }
}
