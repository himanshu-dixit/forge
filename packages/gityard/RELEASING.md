# Releasing gityard

This document describes the release process for gityard, including stable and RC (Release Candidate) releases.

## Release Types

### Stable Releases
Stable releases are production-ready versions that go to npm with the `latest` tag.

**Trigger**: Push a tag matching `v*` (e.g., `v1.0.0`, `v1.2.3`)

**NPM Tag**: `latest`

**Example**:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### RC Releases
RC releases are pre-release versions for testing before a stable release.

**Trigger**: Push a tag matching `v*rc*` (e.g., `v1.0.0-rc.1`, `v1.0.0rc1`)

**NPM Tag**: `rc`

**Example**:
```bash
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```

## Release Workflow

When you push a tag, the GitHub Actions workflow will:

1. **Checkout** the repository
2. **Setup Bun** and install dependencies
3. **Run lint** and tests
4. **Build** the package
5. **Extract version** from the tag name
6. **Determine release type** (stable vs RC)
7. **Publish to npm**:
   - Stable releases: `npm publish --tag latest`
   - RC releases: `npm publish --tag rc`
8. **Create GitHub Release** with the tag name

## Installing RC Versions

To install an RC version of gityard:

```bash
npm install gityard@rc
```

Or with a specific RC version:

```bash
npm install gityard@1.0.0-rc.1
```

## Versioning

gityard uses [Semantic Versioning](https://semver.org/):

- **MAJOR**: When you make incompatible API changes
- **MINOR**: When you add functionality in a backwards compatible manner
- **PATCH**: When you make backwards compatible bug fixes

### RC Version Format

RC versions should follow these patterns:
- `vMAJOR.MINOR.PATCH-rc.N` (e.g., `v1.0.0-rc.1`, `v1.0.0-rc.2`)
- `vMAJOR.MINOR.PATCHrcN` (e.g., `v1.0.0rc1`, `v1.0.0rc2`)

## Testing RC Releases

Before promoting an RC to stable:

1. Install the RC version: `npm install gityard@rc`
2. Test the functionality thoroughly
3. Fix any issues found
4. Create a new RC version with fixes
5. Repeat until stable
6. Push stable tag: `git tag v1.0.0 && git push origin v1.0.0`

## Release Checklist

Before releasing:

- [ ] All tests passing
- [ ] Linting passes
- [ ] Documentation updated
- [ ] CHANGELOG updated (if applicable)
- [ ] Version bumped in `package.json`
- [ ] Commit message follows conventional commits format

After releasing:

- [ ] Verify npm package published
- [ ] Verify GitHub release created
- [ ] Install and test published package
- [ ] Update release notes in GitHub

## Manual Release Process

If you need to publish manually (e.g., for testing):

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Publish stable release
npm publish --access public --tag latest

# Or publish RC release
npm publish --access public --tag rc
```

## Rollbacks

If a release has critical issues:

1. Yank the version from npm:
   ```bash
   npm unpublish gityard@1.0.0
   ```

2. Delete the GitHub release
3. Delete the tag:
   ```bash
   git tag -d v1.0.0
   git push origin :refs/tags/v1.0.0
   ```

4. Create a fixed version and release normally
