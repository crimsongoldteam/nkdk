#!/bin/sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

find "$root/lib/metadata/" \( -name "types.ts" -o -name "importFromXML.ts" -o -name "exportToXML.ts" -o -name "exportToEnterprise.ts" \) -type f -exec npx organize-imports-cli {} \;

find "$root/lib/metadata/" \( -name "types.ts" -o -name "importFromXML.ts" -o -name "exportToXML.ts" -o -name "exportToEnterprise.ts" \) -type f -exec npx prettier --write {} \;

