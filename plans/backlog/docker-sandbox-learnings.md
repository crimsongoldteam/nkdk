# Docker Sandbox Setup: Learnings & Tutorial Notes

## Goal

Get Docker sandboxes working with custom environment variables (specifically `GH_TOKEN` and `CLAUDE_CODE_OAUTH_TOKEN`) so we can spawn N sandboxes in parallel without manual authentication each time.

## The Problem

Docker sandboxes run Claude Code in isolated microVMs. By default:

- You must authenticate interactively every time you create a new sandbox
- There's no `-e` or `--env-file` flag on `docker sandbox run`
- Environment variables from your host shell don't automatically flow into the sandbox
- The sandbox uses a proxy for API credentials, but it requires env vars set on the host and a Docker Desktop restart

We wanted to read credentials from a `.env` file in the project (already gitignored) so sandboxes are self-contained and reproducible.

---

## What We Tried (and Why It Failed)

### 1. `.bashrc` exports in the Dockerfile

**Approach:** Append `export CLAUDE_CODE_OAUTH_TOKEN=...` logic to `/home/agent/.bashrc` in the Dockerfile, reading from `.env` at shell startup.

**Why it failed:** The default Ubuntu `.bashrc` has a guard clause `[ -z "$PS1" ] && return` that exits immediately for non-interactive shells. Claude Code's agent runs commands as non-interactive bash invocations, so `.bashrc` exports never execute.

### 2. `BASH_ENV` for loading env vars

**Approach:** Set `ENV BASH_ENV=/home/agent/.env_loader` in the Dockerfile, with a loader script that reads from `.env`. `BASH_ENV` is sourced by bash for non-interactive shells (the opposite of `.bashrc`).

**Result:** This works for commands Claude _runs_ (e.g., `gh` CLI picks up `GH_TOKEN`), but NOT for the `claude` binary itself. The `claude` process is launched directly by the sandbox daemon — not via bash — so `BASH_ENV` is never sourced before `claude` starts. The env vars are only available in bash subprocesses that Claude spawns.

**Verdict:** Useful for `GH_TOKEN` (which `gh` CLI reads from subprocesses), but not for authenticating Claude Code itself.

### 3. `-e` flag on `docker sandbox run`

**Approach:** Pass env vars with `docker sandbox run -e CLAUDE_CODE_OAUTH_TOKEN=... claude .`

**Why it failed:** The `-e` flag doesn't exist on `docker sandbox run`. The only flags are `--name`, `-t/--template`, and `--pull-template`. Multiple blog posts and tutorials incorrectly document `-e` support.

### 4. Setting `ANTHROPIC_API_KEY` in host `~/.bashrc`

**Approach:** The Docker sandbox docs say the daemon reads from `~/.bashrc`. Set the API key there and restart Docker Desktop.

**Why it failed on WSL2:** The sandbox daemon runs as part of Docker Desktop on the Windows side. It does not read WSL2's `~/.bashrc`. Setting the key as a Windows User environment variable didn't work either. Even after Docker Desktop restarts, the daemon didn't pick it up.

### 5. Setting `ANTHROPIC_API_KEY` as a Windows environment variable

**Approach:** `powershell.exe -Command "[System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', '...', 'User')"`

**Why it failed:** Docker Desktop's sandbox daemon still didn't pick it up after restart. The proxy mechanism may not work the way the docs describe on WSL2.

### 6. `apiKeyHelper` in `~/.claude/settings.json` (inside the Docker image)

**Approach:** The `apiKeyHelper` setting runs a shell script that returns an API key. We tried writing it to `/home/agent/.claude/settings.json` in the Dockerfile.

**Why it failed:** The sandbox overwrites `~/.claude/settings.json` on creation with its own defaults (`themeId`, `bypassPermissions`, etc.). Anything written at build time gets replaced at runtime. The file doesn't even exist at build time — it's created by the sandbox daemon on startup.

### 7. `apiKeyHelper` in project `.claude/settings.local.json`

**Approach:** Put `apiKeyHelper` in the project-level settings (which are mounted into the sandbox).

**Why it failed:** Project settings are read by ALL Claude Code instances — including the one running on the host. The `apiKeyHelper` tried to return an OAuth token as an API key, breaking the host Claude Code session with "Invalid API key · Fix external API key".

### 8. Overwriting `~/.claude/settings.json` with `jq` merge at build time

**Approach:** Use `jq` to merge `apiKeyHelper` into the existing settings file.

**Why it failed:** The file doesn't exist at build time (`No such file or directory`). It's created by the sandbox daemon after the container starts.

### 9. Upgrading Claude Code version

**Discovery:** The sandbox base image (`docker/sandbox-templates:claude-code`) ships Claude Code v2.0.76. The host was running v2.1.76. Features like `apiKeyHelper` and `CLAUDE_CODE_OAUTH_TOKEN` env var support may not exist in 2.0.x.

**What worked:** `curl -fsSL https://claude.ai/install.sh | bash` as the `agent` user upgrades Claude Code. Must run as `agent` (not `root`) because the binary installs to `/home/agent/.local/`.

**What didn't work:** Running the install script as `root` in the Dockerfile — it installs to root's home, not `/home/agent/.local/`.

---

## What Finally Worked

### The claude wrapper approach

The solution has three parts:

#### Part 1: `BASH_ENV` for subprocess env vars (e.g., `GH_TOKEN`)

```dockerfile
ENV BASH_ENV=/home/agent/.env_loader
RUN cat > /home/agent/.env_loader <<'EOF'
if [ -f .env ]; then
  for _var in GH_TOKEN; do
    _val=$(grep "^${_var}=" .env | cut -d= -f2-)
    if [ -n "$_val" ]; then export "${_var}=${_val}"; fi
  done
  unset _var _val
fi
EOF
```

This works because `gh` CLI runs as a bash subprocess of Claude, and `BASH_ENV` is sourced for non-interactive bash shells.

#### Part 2: Upgrade Claude Code

```dockerfile
USER agent
RUN curl -fsSL https://claude.ai/install.sh | bash
```

Must run as `agent` user. This gets us from v2.0.76 to the latest version which properly supports `CLAUDE_CODE_OAUTH_TOKEN`.

#### Part 3: Claude binary wrapper for OAuth token injection

```dockerfile
RUN cat > /usr/local/bin/claude <<'WRAPPER'
#!/bin/bash
if [ -z "$CLAUDE_CODE_OAUTH_TOKEN" ] && [ -f .env ]; then
  CLAUDE_CODE_OAUTH_TOKEN=$(grep "^CLAUDE_CODE_OAUTH_TOKEN=" .env | cut -d= -f2-)
  export CLAUDE_CODE_OAUTH_TOKEN
fi
exec /home/agent/.local/bin/claude "$@"
WRAPPER
RUN chmod +x /usr/local/bin/claude
ENV PATH=/usr/local/bin:$PATH
```

**Why this works:**

- The sandbox daemon launches `claude` by name from PATH
- Our wrapper at `/usr/local/bin/claude` is found first (PATH is prepended)
- The wrapper reads `CLAUDE_CODE_OAUTH_TOKEN` from `.env` and exports it
- Then `exec`s the real binary at `/home/agent/.local/bin/claude`
- The real binary sees the env var and authenticates without interactive login

**Why this is future-proof:**

- Claude auto-updates only touch `~/.local/share/claude/versions/` and `~/.local/bin/claude`
- The wrapper at `/usr/local/bin/claude` is untouched by updates
- The wrapper calls the real binary by absolute path, so it always finds the latest version

---

## Key Architecture Details

### Docker Sandbox Architecture

- Sandboxes run in microVMs, not regular containers
- A proxy at `host.docker.internal:3128` intercepts HTTP requests and can inject API credentials
- The proxy approach requires env vars set on the host and a Docker Desktop restart
- The sandbox daemon injects env vars like `HTTP_PROXY`, `IS_SANDBOX`, `WORKSPACE_DIR` into PID 1
- `BASH_ENV` set via Dockerfile `ENV` persists in PID 1's environment but only affects bash subprocesses
- `~/.claude/settings.json` is overwritten by the sandbox daemon on creation

### Docker Sandbox CLI Limitations

- No `-e` or `--env-file` flags
- Only flags: `--name`, `-t/--template`, `--pull-template`
- `--pull-template never` doesn't work for local-only images — the sandbox always tries to pull from a registry
- You cannot pass `--name`, `--template`, or `--pull-template` when running an existing sandbox
- Sandbox names auto-generate as `claude-<workdir-basename>`

### WSL2-Specific Issues

- The sandbox daemon runs on the Windows side (Docker Desktop), not in WSL2
- WSL2's `~/.bashrc` is not read by the sandbox daemon
- Images built in WSL2's Docker daemon are not visible to Docker Desktop's daemon
- Transfer images via `docker save | powershell.exe -Command "docker load"` (but unnecessary if pushing to Docker Hub)
- `docker --context desktop-linux` fails with "protocol not available" from WSL2

### Custom Template Workflow

- Templates must extend `docker/sandbox-templates:claude-code` (can't use arbitrary base images)
- Build locally, push to Docker Hub (images must be pullable from a registry)
- The `docker sandbox save` command can snapshot a running sandbox as a template

---

## Script Architecture

We created a set of generalizable scripts in `plans/backlog/`:

- **`common.sh`** — shared variables and functions (sandbox name, Docker Hub user detection, sandbox existence check)
- **`setup.sh`** — checks Docker Hub login, builds/pushes template image, creates sandbox
- **`cleanup.sh`** — removes sandbox and local image
- **`once.sh`** — runs a single sandbox session (errors if setup hasn't been run)
- **`afk.sh`** — runs multiple iterations in a loop (errors if setup hasn't been run)

These are designed to be dragged into any repo. The sandbox name and image name are auto-derived from the git repo name and Docker Hub username.

---

## Required `.env` Variables

```
GH_TOKEN=gho_...              # GitHub CLI auth (read via BASH_ENV in subprocesses)
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...  # Claude Code auth (read via wrapper before claude starts)
ANTHROPIC_API_KEY=sk-ant-api03-...        # Optional, for direct API access
```

## Final Dockerfile

```dockerfile
FROM docker/sandbox-templates:claude-code

USER agent

# Upgrade Claude Code to latest (must run as agent, installs to ~/.local/)
RUN curl -fsSL https://claude.ai/install.sh | bash

USER root

# Load tokens from .env for non-interactive shells (how the agent runs commands)
ENV BASH_ENV=/home/agent/.env_loader
RUN cat > /home/agent/.env_loader <<'EOF'
if [ -f .env ]; then
  for _var in GH_TOKEN; do
    _val=$(grep "^${_var}=" .env | cut -d= -f2-)
    if [ -n "$_val" ]; then export "${_var}=${_val}"; fi
  done
  unset _var _val
fi
EOF

# Wrapper that injects CLAUDE_CODE_OAUTH_TOKEN before claude starts.
# Placed in /usr/local/bin which won't be touched by claude auto-updates.
# The real binary lives at ~/.local/bin/claude.
RUN cat > /usr/local/bin/claude <<'WRAPPER'
#!/bin/bash
if [ -z "$CLAUDE_CODE_OAUTH_TOKEN" ] && [ -f .env ]; then
  CLAUDE_CODE_OAUTH_TOKEN=$(grep "^CLAUDE_CODE_OAUTH_TOKEN=" .env | cut -d= -f2-)
  export CLAUDE_CODE_OAUTH_TOKEN
fi
exec /home/agent/.local/bin/claude "$@"
WRAPPER
RUN chmod +x /usr/local/bin/claude

# Prepend /usr/local/bin so wrapper is found before ~/.local/bin
ENV PATH=/usr/local/bin:$PATH

USER agent
```
