/**
 * Init command - Initialize gityard configuration
 */

import chalk from "chalk";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import type { gityardConfig } from "../types";

/**
 * Initialize gityard configuration
 * @param cwd Current working directory
 * @returns Success status
 */
export async function initgityard(cwd: string = process.cwd()): Promise<boolean> {
  const configPath = join(cwd, "gityard.json");

  // Check if config already exists
  if (existsSync(configPath)) {
    throw new Error("gityard.json already exists. Remove it first if you want to reinitialize.");
  }

  // Create default config
  const defaultConfig: gityardConfig = {
    scripts: {
      test: "bun test",
      build: "bun run build",
      dev: "bun run dev",
      lint: "bun run lint",
    },
  };

  // Write config file
  await writeFile(configPath, JSON.stringify(defaultConfig, null, 2) + "\n", "utf-8");

  return true;
}

/**
 * Initialize gityard (CLI mode)
 */
export async function initgityardCLI(): Promise<void> {
  try {
    await initgityard();
    console.log(chalk.green("🛤️ Initialized gityard configuration"));
    console.log(chalk.dim("\nCreated gityard.json with default scripts."));
    console.log(chalk.dim("You can customize it by editing gityard.json"));
  } catch (error: any) {
    console.error(chalk.red(`Error initializing gityard: ${error.message}`));
    process.exit(1);
  }
}
