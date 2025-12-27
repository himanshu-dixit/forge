/**
 * Configuration file parser for gityard.json
 */

import { readFile } from "fs/promises";
import { join } from "path";
import type { gityardConfig } from "./types";

/**
 * Find and load gityard.json configuration
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<gityardConfig | null> {
  const configPath = join(cwd, "gityard.json");

  try {
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content) as gityardConfig;

    // Validate config structure
    if (!config.scripts || typeof config.scripts !== "object") {
      throw new Error("Invalid gityard.json: missing or invalid 'scripts' field");
    }

    return config;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null; // Config file doesn't exist, that's okay
    }
    throw new Error(`Failed to load gityard.json: ${error.message}`);
  }
}

/**
 * Get a specific script from config
 */
export async function getScript(
  scriptName: string,
  cwd: string = process.cwd()
): Promise<string | string[] | null> {
  const config = await loadConfig(cwd);
  if (!config) {
    return null;
  }

  return config.scripts[scriptName] || null;
}
