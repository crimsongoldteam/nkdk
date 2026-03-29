#!/usr/bin/env bash
# Удаляет в packages/core/metadata/forms/elements файлы:
#   fromXML.test.ts, fromYAML.test.ts, toXML.test.ts, toYAML.test.ts, toEnterprise.test.ts
# Файлы в packages/core/metadata/forms/elements/__tests__/ не трогает.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE_DIR="$ROOT/packages/core/metadata/forms/elements"

if [[ ! -d "$BASE_DIR" ]]; then
  echo "Нет каталога: $BASE_DIR" >&2
  exit 1
fi

count=0
while IFS= read -r -d '' file; do
  rm "$file"
  echo "Удалён: $file"
  ((count++)) || true
done < <(
  find "$BASE_DIR" -type f \( \
    -name "fromXML.test.ts" -o \
    -name "fromYAML.test.ts" -o \
    -name "toXML.test.ts" -o \
    -name "toYAML.test.ts" -o \
    -name "toEnterprise.test.ts" \
  \) ! -path "$BASE_DIR/__tests__/*" -print0
)

echo "Готово. Удалено файлов: $count"
