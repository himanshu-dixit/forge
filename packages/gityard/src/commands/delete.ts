/**
 * Delete a worktree branch (removes worktree first)
 */

import { branchExistsLocally, execGit, getMainWorktreePath, parseWorktreeList, resolveBaseBranch } from "../utils/git";
import { getWorktreeName } from "../utils/worktree";
import { rmWorktree } from "../utils/worktree-rm";

type DeleteOptions = {
  force?: boolean;
  forceBranch?: boolean;
};

export async function deleteWorktreeBranch(
  nameOrPath: string,
  options: DeleteOptions = {}
): Promise<{ branch: string }> {
  if (!nameOrPath || nameOrPath.trim() === "") {
    throw new Error("Usage: gityard delete <worktree>");
  }

  const repoRoot = await getMainWorktreePath();
  const worktrees = await parseWorktreeList(repoRoot);
  const worktree = worktrees.find(
    (wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath
  );

  if (!worktree) {
    throw new Error(`Worktree not found: ${nameOrPath}`);
  }

  if (worktree.path === repoRoot) {
    throw new Error("Cannot delete the main worktree.");
  }

  if (worktree.isDetached || worktree.isBare || worktree.branch === "detached") {
    throw new Error("Cannot delete a detached or bare worktree branch.");
  }

  const baseBranch = await resolveBaseBranch("master", repoRoot);
  if (baseBranch && worktree.branch === baseBranch) {
    throw new Error(`Refusing to delete base branch: ${baseBranch}.`);
  }

  await rmWorktree(worktree.path, options.force ?? false);

  if (!(await branchExistsLocally(worktree.branch, repoRoot))) {
    return { branch: worktree.branch };
  }

  const deleteArgs = ["branch", options.forceBranch ? "-D" : "-d", worktree.branch];
  const { exitCode, stderr } = await execGit(deleteArgs, repoRoot);
  if (exitCode !== 0) {
    throw new Error(`Failed to delete branch: ${stderr || "Unknown error"}`);
  }

  return { branch: worktree.branch };
}
