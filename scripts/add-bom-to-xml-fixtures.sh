#!/usr/bin/env bash
# ==============================================================================
# add-bom-to-xml-fixtures.sh — добавляет U+FEFF (BOM) в XML-фикстуры-документы
#
# Алгоритм:
#   1. Обойти все .xml в packages/ и tests/ (исключая node_modules, out-round-trip,
#      packages/core/tempTest — мусор).
#   2. Для каждого файла:
#      - если первые 3 байта = EF BB BF → пропустить (BOM уже есть)
#      - иначе прочитать первые 200 байт; если там есть "<?xml" → добавить BOM
#      - фрагменты (без XML-декларации) не трогаем — они оборачиваются тестами
#        в корневой тег и не являются полноценными XML-документами
#   3. Скрипт идемпотентен: повторный запуск ничего не меняет.
#
# Использование:
#   ./scripts/add-bom-to-xml-fixtures.sh
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BOM=$'\xEF\xBB\xBF'

updated=0
skipped_has_bom=0
skipped_fragment=0

while IFS= read -r -d '' file; do
  first3=$(head -c 3 "$file" | od -An -tx1 | tr -d ' \n')
  if [ "$first3" = "efbbbf" ]; then
    skipped_has_bom=$((skipped_has_bom + 1))
    continue
  fi

  if ! LC_ALL=C head -c 200 "$file" | grep -q '<?xml'; then
    skipped_fragment=$((skipped_fragment + 1))
    continue
  fi

  tmp="$(mktemp)"
  printf '%s' "$BOM" > "$tmp"
  cat "$file" >> "$tmp"
  mv "$tmp" "$file"
  echo "+BOM $file"
  updated=$((updated + 1))
done < <(
  find "${REPO_DIR}/packages" "${REPO_DIR}/tests" \
    -type f -name "*.xml" \
    -not -path "*/node_modules/*" \
    -not -path "*/out-round-trip/*" \
    -not -path "*/packages/core/tempTest/*" \
    -print0 2>/dev/null
)

echo ""
echo "=== BOM summary ==="
echo "Обновлено (добавлен BOM):  ${updated}"
echo "Пропущено (BOM уже есть):  ${skipped_has_bom}"
echo "Пропущено (фрагмент):      ${skipped_fragment}"
