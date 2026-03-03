# Submodule Integration Guide

How to integrate this repository as a git submodule into your projects.

## Why Use as a Submodule?

- **Version Control:** Pin specific versions for reproducibility
- **Easy Updates:** Pull latest practices with one command
- **Consistency:** Same instructions across all projects
- **Team Customization:** Organization fork with team standards

**When NOT to use:** Heavy per-project customization (fork instead), one-off projects, team unfamiliar with submodules.

## Setup

### Step 1: Add Submodule

```bash
cd /path/to/your/project
git submodule add https://github.com/yourusername/copilot-instructions.git .github/copilot-instructions
```

### Step 2: Create Reference

**Option A: Symlink (small/mixed projects)**

```bash
cd .github
ln -s copilot-instructions/copilot-instructions.md copilot-instructions.md
```

Windows (PowerShell as Administrator):

```powershell
New-Item -ItemType SymbolicLink -Path "copilot-instructions.md" -Target "copilot-instructions\copilot-instructions.md"
```

**Option B: Domain-specific link (recommended for large projects to avoid timeouts)**

```bash
cd .github
ln -s copilot-instructions/instructions/backend.instructions.md copilot-instructions.md
# Or: web.instructions.md, ops.instructions.md, scripting.instructions.md
```

**Option C: Lightweight custom orchestrator**

Create `.github/copilot-instructions.md` that references only the domains you need.

### Step 3: Commit

```bash
git add .gitmodules .github/copilot-instructions .github/copilot-instructions.md
git commit -m "Add Copilot instructions as submodule"
```

## Directory Structure

```text
your-project/
├── .gitmodules
├── .github/
│   ├── copilot-instructions/      # Submodule
│   │   ├── copilot-instructions.md
│   │   ├── instructions/
│   │   └── examples/
│   └── copilot-instructions.md    # Symlink → submodule
└── src/
```

## Common Operations

**Clone with submodules:**

```bash
git clone --recursive https://github.com/yourorg/your-project.git
# Or after clone: git submodule init && git submodule update
```

**Update to latest:**

```bash
git submodule update --remote --merge
git add .github/copilot-instructions
git commit -m "Update Copilot instructions"
```

**Pin to specific version:**

```bash
cd .github/copilot-instructions
git checkout v1.2.0
cd ../..
git add .github/copilot-instructions
git commit -m "Pin Copilot instructions to v1.2.0"
```

## Team Workflows

### Organization Setup

1. **Fork** this repo to your organization
2. **Customize** with team standards, tag releases (`v1.0.0`)
3. **Add as submodule** to all team projects using your fork URL

### Updating Across Projects

```bash
#!/bin/bash
PROJECTS=("project-a" "project-b" "project-c")
VERSION="${1:-latest}"

for project in "${PROJECTS[@]}"; do
    cd "$project"
    cd .github/copilot-instructions
    [[ "$VERSION" == "latest" ]] && git pull origin main || git checkout "$VERSION"
    cd ../..
    git add .github/copilot-instructions
    git commit -m "Update Copilot instructions to $VERSION"
    git push
    cd ..
done
```

### Syncing with Upstream

```bash
git remote add upstream https://github.com/original/copilot-instructions.git
git fetch upstream
git merge upstream/main
git tag -a v1.2.0 -m "Merge upstream improvements"
git push --tags
```

## CI/CD Integration

**GitHub Actions:**

```yaml
steps:
  - uses: actions/checkout@v4
    with:
      submodules: recursive
```

**GitLab CI:**

```yaml
variables:
  GIT_SUBMODULE_STRATEGY: recursive
```

**Jenkins:**

```groovy
checkout([$class: 'GitSCM', extensions: [[$class: 'SubmoduleOption', recursiveSubmodules: true]]])
```

## Troubleshooting

| Problem | Solution |
| --------- | ---------- |
| Submodule directory empty | `git submodule init && git submodule update` |
| Detached HEAD in submodule | `cd .github/copilot-instructions && git checkout main` |
| Changes not appearing | `git submodule update --remote --merge` |
| Merge conflicts | `git checkout --theirs .github/copilot-instructions && git add .github/copilot-instructions` |
| Copilot timeout/slow | Switch to domain-specific symlink (Option B above) |
| Symlink not working (Windows) | Enable Developer Mode, or `git config --global core.symlinks true`, or copy instead of symlink |

**Remove submodule:**

```bash
git submodule deinit -f .github/copilot-instructions
git rm -f .github/copilot-instructions
rm -rf .git/modules/.github/copilot-instructions
rm .github/copilot-instructions.md
git commit -m "Remove Copilot instructions submodule"
```

## Best Practices

- **Start small:** Link one instruction file, add more as needed
- **Rotate contexts:** Switch symlink based on current work domain
- **Pin versions** for production projects, track `main` for development
- **Document** submodule version in project README
- **Never edit** directly in the submodule directory — make changes in the source repo
