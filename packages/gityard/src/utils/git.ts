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
 * @param cwd Optional working directory (repository root). If not provided, uses process.cwd()
 */
export async function parseWorktreeList(cwd?: string): Promise<Worktree[]> {
  const { stdout, stderr, exitCode } = await execGit(["worktree", "list", "--porcelain"], cwd);

  if (exitCode !== 0) {
    // Check if this is a "not a git repository" error
    if (stderr.includes("not a git repository")) {
      throw new Error(`Not a git repository: ${cwd || process.cwd()}`);
    }
    // Check if git is not installed or accessible
    if (stderr.includes("command not found") || stderr.includes("not found")) {
      throw new Error("Git is not installed or not accessible. Please install Git first.");
    }
    // Generic error with more context
    throw new Error(`Failed to list worktrees: ${stderr || "Unknown error"}`);
  }

  const worktrees: Worktree[] = [];
  const lines = stdout.split("\n");
  let current: Partial<Worktree> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("worktree ")) {
      // Save previous worktree if exists
      if (current.path) {
        worktrees.push(current as Worktree);
      }
      current = { 
        path: trimmedLine.substring(9).trim(),
        branch: "detached", // Default
        commit: "unknown"   // Default
      };
    } else if (trimmedLine.startsWith("HEAD ")) {
      current.commit = trimmedLine.substring(5).trim();
    } else if (trimmedLine.startsWith("branch ")) {
      const branchFull = trimmedLine.substring(7).trim();
      // Strip refs/heads/ or refs/remotes/ prefix
      if (branchFull.startsWith("refs/heads/")) {
        current.branch = branchFull.substring(11);
      } else if (branchFull.startsWith("refs/remotes/")) {
        current.branch = branchFull.substring(13);
      } else {
        current.branch = branchFull;
      }
      current.isDetached = false;
    } else if (trimmedLine.startsWith("detached")) {
      current.isDetached = true;
      current.branch = "detached";
    } else if (trimmedLine.startsWith("bare")) {
      current.isBare = true;
      current.branch = "bare";
    } else if (trimmedLine === "" && current.path) {
      // Empty line indicates end of worktree entry
      worktrees.push(current as Worktree);
      current = {};
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
 * @param cwd Optional directory to start searching from
 */
export async function getMainWorktreePath(cwd?: string): Promise<string> {
  // Use show-toplevel to find the root of the current worktree
  const { stdout, exitCode } = await execGit(["rev-parse", "--show-toplevel"], cwd);

  if (exitCode === 0 && stdout.trim()) {
    return stdout.trim();
  }

  // Fallback to --git-dir if --show-toplevel fails (e.g. in a bare repo)
  const { stdout: gitDirStdout, exitCode: gitDirExitCode } = await execGit(["rev-parse", "--git-dir"], cwd);

  if (gitDirExitCode !== 0) {
    throw new Error(`Not a git repository: ${cwd || process.cwd()}`);
  }

  const gitDir = gitDirStdout.trim();
  // If .git is a directory, the main worktree is its parent
  if (gitDir === ".git") {
    return cwd || process.cwd();
  }
  if (gitDir.endsWith("/.git")) {
    return gitDir.substring(0, gitDir.length - 5);
  }
  
  // For other cases, return the directory containing the git dir
  return cwd || process.cwd();
}

/**
 * Check if a branch exists locally
 */
export async function branchExistsLocally(branchName: string): Promise<boolean> {
  const { exitCode } = await execGit(["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`]);
  return exitCode === 0;
}

/**
 * Check if a branch exists remotely
 */
export async function branchExistsRemotely(branchName: string): Promise<boolean> {
  const { exitCode } = await execGit(["show-ref", "--verify", "--quiet", `refs/remotes/origin/${branchName}`]);
  return exitCode === 0;
}

/**
 * List all available branches (local and remote)
 */
export async function listBranches(): Promise<{ local: string[]; remote: string[] }> {
  const localResult = await execGit(["branch", "--format=%(refname:short)"]);
  const remoteResult = await execGit(["branch", "--remote", "--format=%(refname:short)"]);
  
  return {
    local: localResult.stdout.split("\n").filter(b => b),
    remote: remoteResult.stdout
      .split("\n")
      .filter(b => b)
      .map(b => b.replace(/^origin\//, ""))
  };
}
