# Helper Monorepo

A Bun-powered monorepo workspace.

## Structure

```
.
├── apps/          # Applications
├── packages/      # Shared packages
└── package.json   # Root workspace configuration
```

## Getting Started

### Install Dependencies

```bash
bun install
```

### Run Scripts

Run scripts across all workspaces:

```bash
# Development mode
bun run dev

# Build all packages
bun run build

# Run tests
bun run test

# Lint all packages
bun run lint
```

### Run Scripts for Specific Workspace

```bash
# Run dev script for a specific package
bun run --filter <package-name> dev

# Run build for a specific package
bun run --filter <package-name> build
```

## Adding New Packages

1. Create a new directory in `packages/` or `apps/`
2. Add a `package.json` with a unique name
3. Run `bun install` at the root to link workspaces

## Workspaces

Workspaces are automatically discovered from:
- `packages/*`
- `apps/*`
