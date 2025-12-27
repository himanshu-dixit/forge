/**
 * Tests for init command
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { initgityard } from "../../src/commands/init";
import { writeFile, rm, readFile, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("initgityard", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gityard-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("should create gityard.json with default scripts", async () => {
    const success = await initgityard(tempDir);
    expect(success).toBe(true);

    const configPath = join(tempDir, "gityard.json");
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content);

    expect(config).toHaveProperty("scripts");
    expect(config.scripts.test).toBe("bun test");
    expect(config.scripts.build).toBe("bun run build");
    expect(config.scripts.dev).toBe("bun run dev");
    expect(config.scripts.lint).toBe("bun run lint");
  });

  it("should create gityard.json with pretty formatting", async () => {
    await initgityard(tempDir);

    const configPath = join(tempDir, "gityard.json");
    const content = await readFile(configPath, "utf-8");

    expect(content).toContain("{\n");
    expect(content).toContain("  ");
    expect(content).toContain("\n}");
  });

  it("should create gityard.json with trailing newline", async () => {
    await initgityard(tempDir);

    const configPath = join(tempDir, "gityard.json");
    const content = await readFile(configPath, "utf-8");

    expect(content).toEndWith("\n");
  });

  it("should throw error when gityard.json already exists", async () => {
    const configPath = join(tempDir, "gityard.json");
    await writeFile(configPath, '{"scripts":{}}', "utf-8");

    try {
      await initgityard(tempDir);
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toBe("gityard.json already exists. Remove it first if you want to reinitialize.");
    }
  });

  it("should use process.cwd() when no directory provided", async () => {
    // This test assumes we're in the project directory
    // In a real test, you'd mock process.cwd() or use a different approach
    const success = await initgityard();
    expect(success).toBe(true);

    // Clean up
    const configPath = join(process.cwd(), "gityard.json");
    try {
      await rm(configPath);
    } catch {
      // File might not exist, that's ok
    }
  });
});
