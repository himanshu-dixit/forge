/**
 * Type definitions for gityard
 */

export interface Worktree {
  path: string;
  branch: string;
  commit: string;
  isBare?: boolean;
  isDetached?: boolean;
}

export interface gityardConfig {
  scripts: Record<string, string | string[]>;
}

export interface CLIOptions {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
}
