#!/bin/bash
set -eo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

DOCKER_USER=$(get_docker_user)
IMAGE="${DOCKER_USER:+$DOCKER_USER/}claude-sandboxed:v1"

echo "Sandbox: $SANDBOX_NAME"
echo "Image:   $IMAGE"
echo ""

if docker sandbox ls 2>/dev/null | grep -q "$SANDBOX_NAME"; then
  echo "Removing sandbox '$SANDBOX_NAME'..."
  docker sandbox rm "$SANDBOX_NAME"
else
  echo "Sandbox '$SANDBOX_NAME' not found, skipping."
fi

if docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Removing local image '$IMAGE'..."
  docker rmi "$IMAGE"
else
  echo "Image '$IMAGE' not found locally, skipping."
fi

echo ""
echo "Cleanup complete."
