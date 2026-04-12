#!/bin/bash
set -eo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

require_docker_user

SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
if [ ! -f "$SCRIPT_DIR/Dockerfile" ]; then
  echo "Error: No Dockerfile found next to setup.sh."
  exit 1
fi

echo "Repo:    $REPO_NAME"
echo "Image:   $IMAGE"
echo "Sandbox: $SANDBOX_NAME"
echo ""

if docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Template image already exists, skipping build."
else
  echo "Building sandbox template..."
  docker build -t "$IMAGE" "$SCRIPT_DIR"
  echo "Pushing to Docker Hub..."
  docker push "$IMAGE"
fi

if docker sandbox ls 2>/dev/null | grep -q "$SANDBOX_NAME"; then
  echo "Sandbox '$SANDBOX_NAME' already exists."
else
  echo "Creating sandbox '$SANDBOX_NAME'..."
  docker sandbox run \
    -t "$IMAGE" \
    claude . -- \
    --print "Setup complete. Reply with only: Sandbox initialized successfully."
fi
