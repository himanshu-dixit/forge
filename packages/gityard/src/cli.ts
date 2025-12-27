#!/usr/bin/env bun
/**
 * CLI entry point for gityard
 */

import { Command } from "commander";
import { listWorktreesCLI } from "./commands/list";
import { rmWorktreeCLI } from "./commands/rm";
import { switchWorktreeCLI } from "./commands/switch";
import { runScriptCLI } from "./commands/run";
import { initgityardCLI } from "./commands/init";

const VERSION = "1.0.0";

const program = new Command();

program
  .name("gityard")
  .description("🛤️ Manage Git worktrees with ease")
  .version(VERSION);

program
  .command("init")
  .description("Initialize gityard configuration (creates gityard.json)")
  .action(async () => {
    await initgityardCLI();
  });

program
  .command("list")
  .description("List all worktrees")
  .action(async () => {
    await listWorktreesCLI();
  });

program
  .command("rm")
  .description("Remove a worktree by name or path")
  .argument("<name>", "Worktree name or path")
  .option("-f, --force", "Force removal even if worktree has modified or untracked files")
  .action(async (name: string, options: { force: boolean }) => {
    await rmWorktreeCLI(name, options.force);
  });

program
  .command("switch")
  .description("Switch to a worktree by name or path (creates it if it doesn't exist)")
  .argument("[name]", "Worktree name or path (optional - prompts if not provided)")
  .argument("[branch]", "Branch name (optional, used when creating new worktree)")
  .action(async (name?: string, branch?: string) => {
    await switchWorktreeCLI(name, branch);
  });

program
  .command("run")
  .description("Run a script from gityard.json in a worktree")
  .argument("<worktree>", "Worktree name or path")
  .argument("<script>", "Script name from gityard.json")
  .action(async (worktree: string, script: string) => {
    await runScriptCLI(worktree, script);
  });

program.parse();
