# Gityard Development Wiki 🛤️

This wiki contains comprehensive documentation for developers contributing to or maintaining the `gityard` package.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Key Components](#key-components)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building & Releasing](#building--releasing)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Gityard** is a CLI and ESM module for managing Git worktrees with ease. It provides both a command-line interface and a programmatic API for:

- Creating and managing Git worktrees
- Switching between worktrees
- Running scripts in specific worktrees
- Managing configuration via `gityard.json`

### Key Features

- 🚀 Dual interface: CLI and ESM module
- 🛤️ Simplified worktree management
- ⚙️ Configurable scripts via `gityard.json`
- 🎨 Beautiful colored terminal output
- 🔧 TypeScript support with full type definitions

### Technology Stack

- **Runtime**: Bun (JavaScript runtime & package manager)
- **Language**: TypeScript
- **CLI Framework**: Commander.js
- **Terminal Styling**: Chalk
- **Git Integration**: Native git commands via `Bun.spawn()`

---

## Architecture

### Design Principles

1. **Separation of Concerns**: CLI logic is separated from core functionality
2. **Dual Interface**: Same core functions work as CLI commands and ESM exports
3. **Type Safety**: Full TypeScript coverage with exported types
4. **Error Handling**: Graceful error handling with user-friendly messages
5. **Git Native**: Uses native git commands through `Bun.spawn()`

### Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                   CLI Layer                         │
│  (src/cli.ts - Commander.js based CLI)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├─────────────────┬──────────────────┐
                   │                 │                  │
┌──────────────────┴─┐  ┌───────────┴────┐  ┌────────┴──────────┐
│  Command: init     │  │  Command: list  │  │  Command: switch  │
└───────────────────┘  └────────────────┘  └───────────────────┘
         │                       │                    │
         │                       │                    │
┌────────▼─────────┐  ┌────────▼────────┐  ┌────────▼─────────┐
│  Core Functions  │  │  Core Functions │  │  Core Functions  │
└────────┬─────────┘  └────────┬────────┘  └────────┬─────────┘
         │                      │                     │
         └──────────────────────┴─────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   Utilities     │
                    │  - git.ts       │
                    │  - worktree.ts  │
                    │  - config.ts    │
                    └────────────────┘
```

---

## Project Structure

```
packages/gityard/
├── src/
│   ├── cli.ts                    # CLI entry point (Commander.js)
│   ├── index.ts                  # ESM module exports
│   ├── types.ts                  # TypeScript type definitions
│   ├── config.ts                 # Configuration file parser
│   ├── commands/                 # Command implementations
│   │   ├── init.ts              # Initialize gityard.json
│   │   ├── list.ts              # List worktrees
│   │   ├── rm.ts                # Remove worktree
│   │   ├── switch.ts            # Switch/create worktree
│   │   └── run.ts               # Run script in worktree
│   └── utils/                    # Utility functions
│       ├── git.ts               # Git command execution
│       └── worktree.ts          # Worktree utilities
├── package.json                  # Package configuration
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # User-facing documentation
└── WIKI.md                       # This development wiki
```

### File Descriptions

| File | Purpose |
|------|---------|
| `src/cli.ts` | CLI entry point using Commander.js, defines all commands |
| `src/index.ts` | Public API exports for ESM module usage |
| `src/types.ts` | TypeScript interfaces: Worktree, gityardConfig, CLIOptions |
| `src/config.ts` | Functions to load and parse `gityard.json` |
| `src/commands/init.ts` | Initialize gityard configuration |
| `src/commands/list.ts` | List and display all worktrees |
| `src/commands/rm.ts` | Remove a worktree |
| `src/commands/switch.ts` | Switch to or create worktree |
| `src/commands/run.ts` | Execute script in specific worktree |
| `src/utils/git.ts` | Git command execution and worktree parsing |
| `src/utils/worktree.ts` | Worktree validation and formatting utilities |

---

## Development Setup

### Prerequisites

- **Bun** 1.0+ - Install from [bun.sh](https://bun.sh/)
- **Git** 2.5+ - For worktree support
- **Node.js** 18+ - Only needed if testing with npm/npx

### Installation

```bash
# Navigate to the package directory
cd packages/gityard

# Install dependencies
bun install

# Verify installation
bun --version
```

### Development Commands

```bash
# Run CLI in development mode
bun run dev

# Build the package
bun run build

# Run tests
bun test

# Run linter
bun run lint
```

### IDE Setup

**VS Code** (recommended):
- Install the official [Bun extension](https://marketplace.visualstudio.com/items?itemname=Bun.bun)
- Install the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- Use TypeScript workspace configuration from `tsconfig.json`

**Cursor**:
- Already configured with Bun support
- TypeScript features enabled out of the box

---

## Key Components

### 1. CLI Layer (`src/cli.ts`)

The CLI is built using Commander.js and provides a user-friendly command interface.

**Key Responsibilities**:
- Define command structure
- Parse command-line arguments
- Route to appropriate command handlers
- Display help and version information

**Code Reference**:

```13:20:packages/gityard/src/cli.ts
const program = new Command();

program
  .name("gityard")
  .description("🛤️ Manage Git worktrees with ease")
  .version(VERSION);
```

### 2. Type Definitions (`src/types.ts`)

All TypeScript interfaces used throughout the project.

**Key Types**:

- `Worktree`: Represents a Git worktree with path, branch, commit, and status
- `gityardConfig`: Configuration structure for `gityard.json`
- `CLIOptions`: CLI command options structure

**Code Reference**:

```5:15:packages/gityard/src/types.ts
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
```

### 3. Git Utilities (`src/utils/git.ts`)

Handles all Git command execution using `Bun.spawn()`.

**Key Functions**:

- `execGit(args, cwd?)`: Execute any git command and return output
- `parseWorktreeList()`: Parse git worktree list output into Worktree objects
- `getMainWorktreePath()`: Determine the main repository path

**Code Reference**:

```10:28:packages/gityard/src/utils/git.ts
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
```

### 4. Configuration (`src/config.ts`)

Manages loading and parsing of `gityard.json` configuration files.

**Key Functions**:

- `loadConfig(cwd?)`: Load gityard.json from specified directory
- `getScript(scriptName, cwd?)`: Get a specific script from config

**Code Reference**:

```12:31:packages/gityard/src/config.ts
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
```

### 5. Command Implementations

All commands in `src/commands/` follow a consistent pattern:

- **CLI function**: Handles user interaction, displays output
- **Core function**: Performs the actual operation, returns data
- Both use shared utilities from `utils/` directory

**Example: List Command** (`src/commands/list.ts`)

```typescript
// CLI function - displays output to user
export async function listWorktreesCLI(): Promise<void> {
  const worktrees = await listWorktrees();
  // Display logic with chalk for colors
}

// Core function - returns data
export async function listWorktrees(): Promise<Worktree[]> {
  return await parseWorktreeList();
}
```

---

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following these guidelines:
   - Add TypeScript types for new functions
   - Include JSDoc comments for public functions
   - Use existing utility functions when possible
   - Follow the dual-interface pattern (CLI + ESM export)

3. **Test your changes**:
   ```bash
   # Run tests
   bun test

   # Test CLI manually
   bun run dev <command>

   # Test ESM module
   bun run test-module.ts
   ```

4. **Lint and fix issues**:
   ```bash
   bun run lint
   ```

### Adding a New Command

To add a new command (e.g., `status`):

1. **Create command file**: `src/commands/status.ts`
   ```typescript
   import { execGit } from "../utils/git";

   export async function statusWorktreeCLI(): Promise<void> {
     // CLI implementation
     const result = await statusWorktree();
     console.log(result);
   }

   export async function statusWorktree(): Promise<string> {
     // Core implementation
     const { stdout } = await execGit(["status"]);
     return stdout;
   }
   ```

2. **Export in index.ts**:
   ```typescript
   export { statusWorktree } from "./commands/status";
   ```

3. **Add to CLI** in `src/cli.ts`:
   ```typescript
   import { statusWorktreeCLI } from "./commands/status";

   program
     .command("status")
     .description("Show worktree status")
     .action(async () => {
       await statusWorktreeCLI();
     });
   ```

4. **Update README.md** with new command documentation

### Code Style Guidelines

- **Use async/await** for all asynchronous operations
- **TypeScript strict mode** - define all types explicitly
- **Error handling** - try/catch with descriptive error messages
- **File naming** - kebab-case for files (e.g., `work-tree.ts` → `worktree.ts`)
- **Function naming** - camelCase for functions (e.g., `listWorktrees`)
- **Constants** - UPPER_SNAKE_CASE for constants (e.g., `VERSION`)

---

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test path/to/test-file.test.ts
```

### Test Structure

Tests should be placed in a `tests/` directory alongside source files:

```
src/
├── commands/
│   ├── list.ts
│   └── list.test.ts
```

### Writing Tests

Use Bun's built-in test runner:

```typescript
import { describe, expect, it } from "bun:test";
import { listWorktrees } from "./list";

describe("listWorktrees", () => {
  it("should return an array of worktrees", async () => {
    const worktrees = await listWorktrees();
    expect(Array.isArray(worktrees)).toBe(true);
  });

  it("should include main worktree", async () => {
    const worktrees = await listWorktrees();
    expect(worktrees.length).toBeGreaterThan(0);
  });
});
```

### Test Coverage

- Aim for **80%+ code coverage**
- Test both success and error paths
- Mock Git commands using `Bun.spawn` spy/stub when needed
- Test CLI output formatting

---

## Building & Releasing

### Building the Package

```bash
# Build for production
bun run build

# Output will be in dist/ directory
```

### Version Management

Update version in `package.json`:

```json
{
  "version": "1.0.1"
}
```

Also update in `src/cli.ts`:

```typescript
const VERSION = "1.0.1";
```

### Release Process

1. **Update version** in `package.json` and `src/cli.ts`
2. **Update CHANGELOG.md** (create this file if it doesn't exist)
3. **Run tests**: `bun test`
4. **Build package**: `bun run build`
5. **Commit changes**:
   ```bash
   git add .
   git commit -m "chore: release v1.0.1"
   ```
6. **Create git tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
7. **Publish to npm** (if applicable):
   ```bash
   npm publish
   ```

### CI/CD

The project uses GitHub Actions for automated releases. See `.github/workflows/release.yml` for workflow configuration.

---

## Troubleshooting

### Common Issues

#### 1. "Not a git repository" Error

**Problem**: Commands fail with "Not a git repository"

**Solution**:
- Ensure you're running commands from within a Git repository
- Check that `.git` directory exists
- Use `git init` if starting a new repository

#### 2. Worktree Not Found

**Problem**: `gityard switch` or `gityard rm` can't find worktree

**Solution**:
- Use `gityard list` to see available worktrees
- Check that the worktree name matches exactly
- Try using full path instead of name

#### 3. Permission Errors

**Problem**: Can't create or remove worktrees due to permissions

**Solution**:
- Check directory permissions
- Ensure you have write access to repository
- Try running with appropriate permissions

#### 4. gityard.json Not Found

**Problem**: `gityard run` fails to find config

**Solution**:
- Run `gityard init` to create config file
- Ensure you're in the correct directory
- Check that `gityard.json` exists in repository root

### Debugging

Enable debug logging by setting environment variable:

```bash
GITYARD_DEBUG=1 bun run dev <command>
```

### Getting Help

- Check the README.md for usage examples
- Review this WIKI.md for development documentation
- Open an issue on the project repository
- Review git worktree documentation: `git help worktree`

---

## Contributing

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated (README.md and this WIKI.md)
- [ ] TypeScript types properly defined
- [ ] No linting errors

### Reporting Bugs

When reporting bugs, include:
- OS version
- Bun version
- Git version
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

---

## Resources

- **Official Git Worktree Documentation**: [git-scm.com/docs/git-worktree](https://git-scm.com/docs/git-worktree)
- **Bun Documentation**: [bun.sh/docs](https://bun.sh/docs)
- **Commander.js**: [github.com/tj/commander.js](https://github.com/tj/commander.js)
- **Chalk**: [github.com/chalk/chalk](https://github.com/chalk/chalk)

---

**Last Updated**: 2025-12-28
**Maintainers**: See package.json author field
**License**: MIT
