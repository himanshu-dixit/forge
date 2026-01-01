/**
 * Utility for removing Git worktrees
 */

import { existsSync } from "node:fs";
import { rm as rmFs, stat } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { execGit, parseWorktreeList, getMainWorktreePath } from "./git";
import { getWorktreeName } from "./worktree";
import { loadConfig } from "../config";
import { runScriptByName } from "../commands/run";

async function cleanupWorktreePath(worktreePath: string, repoRoot: string): Promise<void> {
  const resolvedPath = resolve(worktreePath);
  const resolvedRoot = resolve(repoRoot);
  const rootPath = parse(resolvedPath).root;

  if (resolvedPath === resolvedRoot || resolvedPath === rootPath) {
    return;
  }

  if (!existsSync(resolvedPath)) {
    return;
  }

  const stats = await stat(resolvedPath).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    return;
  }

  await rmFs(resolvedPath, { recursive: true, force: true });
}

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
 * Remove a worktree by name or path
 * @param nameOrPath Worktree name or path
 * @param force Force removal even if worktree has modified or untracked files
 * @returns Success status
 */
export async function rmWorktree(nameOrPath: string, force: boolean = false): Promise<boolean> {
  const repoRoot = await getMainWorktreePath();
  const worktrees = await parseWorktreeList(repoRoot);

  // Find worktree by name or path
  const worktree = worktrees.find(
    (wt) => wt.path === nameOrPath || getWorktreeName(wt.path) === nameOrPath
  );

  if (!worktree) {
    throw new Error(`Worktree not found: ${nameOrPath}`);
  }

  const config = await loadConfig(repoRoot);
  await runHookScripts(config?.hooks?.onRemove, worktree.path, repoRoot);

  // Remove worktree
  const { exitCode, stderr } = await execGit(
    ["worktree", "remove", worktree.path, ...(force ? ["--force"] : [])],
    repoRoot
  );

  if (exitCode !== 0) {
    throw new Error(`Failed to remove worktree: ${stderr}`);
  }

  await cleanupWorktreePath(worktree.path, repoRoot);

  return true;
}
