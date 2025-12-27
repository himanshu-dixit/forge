/**
 * Git command execution utilities
 */

import type { Worktree } from "../types";

/**
 * Execute a git command and return the output
 */
export async function execGit(
  args: string[],
  cwd?: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["git", ...args], {
    cwd: cwd || process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

/**
 * Parse git worktree list output
 * Format: <path> <commit> [<branch>]
 */
export async function parseWorktreeList(): Promise<Worktree[]> {
  const { stdout, exitCode } = await execGit(["worktree", "list", "--porcelain"]);

  if (exitCode !== 0) {
    throw new Error("Failed to list worktrees");
  }

  const worktrees: Worktree[] = [];
  const lines = stdout.split("\n");
  let current: Partial<Worktree> = {};

  for (const line of lines) {
    if (line.startsWith("worktree ")) {
      // Save previous worktree if exists
      if (current.path) {
        worktrees.push(current as Worktree);
      }
      current = { path: line.substring(9).trim() };
    } else if (line.startsWith("HEAD ")) {
      current.commit = line.substring(5).trim();
    } else if (line.startsWith("branch ")) {
      current.branch = line.substring(7).trim();
      current.isDetached = false;
    } else if (line.startsWith("detached")) {
      current.isDetached = true;
      if (!current.branch) {
        current.branch = "HEAD";
      }
    } else if (line.startsWith("bare")) {
      current.isBare = true;
    } else if (line === "") {
      // Empty line indicates end of worktree entry
      if (current.path) {
        worktrees.push(current as Worktree);
        current = {};
      }
    }
  }

  // Add last worktree if exists
  if (current.path) {
    worktrees.push(current as Worktree);
  }

  return worktrees;
}

/**
 * Get the main worktree path (usually the repository root)
 */
export async function getMainWorktreePath(): Promise<string> {
  const { stdout, exitCode } = await execGit(["rev-parse", "--git-dir"]);

  if (exitCode !== 0) {
    throw new Error("Not a git repository");
  }

  const gitDir = stdout.trim();
  // If .git is a directory, the main worktree is its parent
  // If .git is a file (submodule), parse it
  if (gitDir.endsWith(".git")) {
    return gitDir.substring(0, gitDir.length - 4);
  }
  return process.cwd();
}
