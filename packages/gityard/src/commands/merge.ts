/**
 * Merge worktree branch into master
 */

import {
  branchExistsLocally,
  execGit,
  getCurrentBranch,
  getMainWorktreePath,
  getWorktreeStatus,
  parseWorktreeList,
  resolveBaseBranch,
} from "../utils/git";
import { getWorktreeName } from "../utils/worktree";

type MergeOptions = {
  squash?: boolean;
  noFF?: boolean;
  baseBranch?: string;
};

export async function mergeWorktree(
  nameOrPath: string,
  options: MergeOptions = {}
): Promise<{ baseBranch: string; mergedBranch: string }> {
  if (!nameOrPath || nameOrPath.trim() === "") {
    throw new Error("Usage: gityard merge <worktree> [--squash|--no-ff]");
  }

  const repoRoot = await getMainWorktreePath();
  const worktrees = await parseWorktreeList(repoRoot);
  const worktree = worktrees.find(
    (wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath
  );

  if (!worktree) {
    throw new Error(`Worktree not found: ${nameOrPath}`);
  }
  if (worktree.isDetached || worktree.isBare || worktree.branch === "detached") {
    throw new Error("Cannot merge from a detached or bare worktree.");
  }

  const baseBranch = await resolveBaseBranch(options.baseBranch || "master", repoRoot);
  if (!baseBranch || !(await branchExistsLocally(baseBranch, repoRoot))) {
    throw new Error(`Base branch not found: ${options.baseBranch || "master"}`);
  }
  if (worktree.branch === baseBranch) {
    throw new Error(`Worktree is already on ${baseBranch}.`);
  }
  if (!options.squash && !options.noFF) {
    throw new Error("Specify a merge strategy: --squash or --no-ff");
  }

  const status = await getWorktreeStatus(repoRoot);
  if (status.staged || status.unstaged || status.untracked) {
    throw new Error("Base worktree has uncommitted changes. Commit or stash first.");
  }

  const currentBranch = await getCurrentBranch(repoRoot);
  if (currentBranch !== baseBranch) {
    const { exitCode, stderr } = await execGit(["checkout", baseBranch], repoRoot);
    if (exitCode !== 0) {
      throw new Error(`Failed to checkout ${baseBranch}: ${stderr || "Unknown error"}`);
    }
  }

  const mergeArgs = ["merge"];
  if (options.squash) {
    mergeArgs.push("--squash");
  }
  if (options.noFF) {
    mergeArgs.push("--no-ff");
  }
  mergeArgs.push(worktree.branch);

  const { exitCode, stderr } = await execGit(mergeArgs, repoRoot);
  if (exitCode !== 0) {
    throw new Error(`Merge failed: ${stderr || "Unknown error"}`);
  }

  return { baseBranch, mergedBranch: worktree.branch };
}
