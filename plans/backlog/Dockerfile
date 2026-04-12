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