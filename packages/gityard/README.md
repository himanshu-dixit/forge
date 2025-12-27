<img src="./assets/logo.png" alt="gityard Logo" width="80" />

# Gityard - Simple worktree SDK & CLI

CLI and ESM module for managing Git worktrees with ease.

Inspired by [https://steveasleep.com](https://steveasleep.com)

## Installation

```bash
# Using npm
npm install -g gityard

# Using bun
bun install -g gityard

# Using npx (no installation needed)
npx gityard --help
```

## CLI Usage 🛤️

### Initialize

Initialize gityard configuration by creating a `gityard.json` file:

```bash
gityard init
```

This creates a `gityard.json` file with default scripts that you can customize.

### List Worktrees

List all Git worktrees in the repository:

```bash
gityard list
```

Output:
```
🛤️ Worktrees:
  /path/to/repo main [abc1234]
  /path/to/repo/feature feature-branch [def5678]
```

### Remove Worktree

Remove a worktree by name or path:

```bash
gityard rm feature-branch
# or
gityard rm /path/to/repo/feature
```

### Switch Worktree

Switch to a worktree by name or path. If the worktree doesn't exist, it will be created:

```bash
# Switch to existing worktree
gityard switch feature-branch
# or
gityard switch /path/to/repo/feature

# Create new worktree (if it doesn't exist)
gityard switch ./feature feature-branch
# The first argument is the path, second is the branch name (optional)

# Use --cd flag to automatically cd into worktree
eval "$(gityard switch --cd feature-branch)"
```

If the worktree doesn't exist and no branch is specified, the worktree name will be used as the branch name.

The `--cd` flag outputs a `cd` command, making it easy to use with `eval` to automatically change to the worktree directory. This works in shells like bash, zsh, and fish.

### Run Script

Execute a script from `gityard.json` in a specific worktree:

```bash
gityard run feature-branch test
```

## Configuration

Initialize gityard configuration:

```bash
gityard init
```

This creates a `gityard.json` file in your repository root with default scripts. You can customize it:

```json
{
  "scripts": {
    "test": "bun test",
    "build": "bun run build",
    "dev": "bun run dev",
    "lint": ["bun run lint", "bun run typecheck"]
  }
}
```

Scripts can be:
- A single command string
- An array of commands (executed sequentially)

## ESM Module Usage

Import and use gityard programmatically:

```typescript
import {
  initgityard,
  listWorktrees,
  rmWorktree,
  switchWorktree,
  runScript,
} from "gityard";

// Initialize git-garden configuration
await initgityard();

// List all worktrees
const worktrees = await listWorktrees();
console.log(worktrees);

// Remove a worktree
await rmWorktree("feature-branch");

// Switch to a worktree (creates it if it doesn't exist)
const path = await switchWorktree("feature-branch");
// Or create new worktree with specific branch
const newPath = await switchWorktree("./new-feature", "new-feature");

// Run a script
await runScript("feature-branch", "test");
```

### Type Definitions

```typescript
interface Worktree {
  path: string;
  branch: string;
  commit: string;
  isBare?: boolean;
  isDetached?: boolean;
}

interface gityardConfig {
  scripts: Record<string, string | string[]>;
}
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize git-garden configuration (creates gityard.json) |
| `list` | List all worktrees |
| `rm <name>` | Remove a worktree by name or path |
| `switch <name> [branch]` | Switch to a worktree by name or path (creates it if it doesn't exist) |
| `switch <name> [branch] --cd` | Switch to worktree and output path for easy cd (use with: `cd $(gityard switch --cd <name)`) |
| `run <worktree> <script>` | Run a script from gityard.json in a worktree |

## Examples

### Basic Workflow

```bash
# Initialize git-garden configuration
gityard init

# List existing worktrees
gityard list

# Create a new worktree for a feature (creates if it doesn't exist)
gityard switch ./my-feature my-feature

# Switch between worktrees
gityard switch main
gityard switch my-feature

# Switch and cd into worktree in one command
cd $(gityard switch --cd my-feature)

# Run tests in a specific worktree
gityard run my-feature test

# Remove a worktree
gityard rm my-feature
```

### Using with npm scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "worktree:list": "gityard list",
    "worktree:switch": "gityard switch"
  }
}
```

## Requirements

- Git 2.5+ (for worktree support)
- Bun runtime (for execution)
- Node.js 18+ (if using npm/npx)

## Development

This project uses:
- [chalk](https://github.com/chalk/chalk) for colored terminal output
- [commander](https://github.com/tj/commander.js) for CLI argument parsing

To contribute or create your own project based on this:

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
bun install

# Run in development mode
bun run dev

# Build the package
bun run build
```

## License

MIT

## Credits

Inspired by [https://steveasleep.com](https://steveasleep.com)
