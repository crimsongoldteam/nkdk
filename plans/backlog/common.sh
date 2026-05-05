#!/bin/bash

REPO_ROOT=$(git rev-parse --show-toplevel)
REPO_NAME=$(basename "$REPO_ROOT")
SANDBOX_NAME="claude-$REPO_NAME"

get_docker_user() {
  local creds_store
  creds_store=$(jq -r '.credsStore // empty' ~/.docker/config.json 2>/dev/null)
  if [ -n "$creds_store" ] && command -v "docker-credential-$creds_store" >/dev/null 2>&1; then
    echo "https://index.docker.io/v1/" | "docker-credential-$creds_store" get 2>/dev/null | jq -r '.Username // empty'
    return
  fi
  docker info 2>/dev/null | awk '/Username:/ {print $2}'
}

require_docker_user() {
  DOCKER_USER=$(get_docker_user)
  if [ -z "$DOCKER_USER" ]; then
    echo "Not logged into Docker Hub. Please run:"
    echo "  docker login"
    exit 1
  fi
  IMAGE="$DOCKER_USER/claude-sandboxed:v1"
}

require_sandbox() {
  if ! docker sandbox ls 2>/dev/null | grep -q "$SANDBOX_NAME"; then
    echo "Sandbox '$SANDBOX_NAME' not found. Please run:"
    echo "  ./plans/backlog/setup.sh"
    exit 1
  fi
}

