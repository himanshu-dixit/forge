/**
 * Tests for configuration loading
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig, getScript } from "../src/config";
import { writeFile, rm, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("loadConfig", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gityard-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("should load valid configuration", async () => {
    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({
      scripts: {
        test: "bun test",
        build: "bun run build",
      },
    });
    await writeFile(configPath, configContent, "utf-8");

    const config = await loadConfig(tempDir);
    expect(config).not.toBeNull();
    expect(config?.scripts.test).toBe("bun test");
    expect(config?.scripts.build).toBe("bun run build");
  });

  it("should load config with array scripts", async () => {
    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({
      scripts: {
        test: ["bun test", "bun lint"],
      },
    });
    await writeFile(configPath, configContent, "utf-8");

    const config = await loadConfig(tempDir);
    expect(config).not.toBeNull();
    expect(Array.isArray(config?.scripts.test)).toBe(true);
    expect(config?.scripts.test).toEqual(["bun test", "bun lint"]);
  });

  it("should return null when config file does not exist", async () => {
    const config = await loadConfig(tempDir);
    expect(config).toBeNull();
  });

  it("should throw error for invalid JSON", async () => {
    const configPath = join(tempDir, "gityard.json");
    await writeFile(configPath, "{ invalid json }", "utf-8");

    try {
      await loadConfig(tempDir);
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain("Failed to load gityard.json");
    }
  });

  it("should throw error when scripts field is missing", async () => {
    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({ name: "test" });
    await writeFile(configPath, configContent, "utf-8");

    try {
      await loadConfig(tempDir);
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain("Invalid gityard.json: missing or invalid 'scripts' field");
    }
  });

  it("should throw error when scripts field is not an object", async () => {
    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({ scripts: "not an object" });
    await writeFile(configPath, configContent, "utf-8");

    try {
      await loadConfig(tempDir);
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain("Invalid gityard.json: missing or invalid 'scripts' field");
    }
  });
});

describe("getScript", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gityard-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("should return script when config exists and script found", async () => {
    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({
      scripts: {
        test: "bun test",
        build: "bun run build",
      },
    });
    await writeFile(configPath, configContent, "utf-8");

    const script = await getScript("test", tempDir);
    expect(script).toBe("bun test");
  });

  it("should return null when config exists but script not found", async () => {
    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({
      scripts: {
        test: "bun test",
      },
    });
    await writeFile(configPath, configContent, "utf-8");

    const script = await getScript("build", tempDir);
    expect(script).toBeNull();
  });

  it("should return null when config file does not exist", async () => {
    const script = await getScript("test", tempDir);
    expect(script).toBeNull();
  });

  it("should return array script when script is an array", async () => {
    const configPath = join(tempDir, "gityard.json");
    const configContent = JSON.stringify({
      scripts: {
        test: ["bun test", "bun lint"],
      },
    });
    await writeFile(configPath, configContent, "utf-8");

    const script = await getScript("test", tempDir);
    expect(Array.isArray(script)).toBe(true);
    expect(script).toEqual(["bun test", "bun lint"]);
  });
});
