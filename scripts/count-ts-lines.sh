#!/usr/bin/env bash
# Считает суммарное число строк во всех .ts файлах репозитория,
# пропуская деревья node_modules (в корне и во вложенных пакетах).
set -euo pipefail

root="${1:-.}"
cd "$root"

total_lines=0
file_count=0

while IFS= read -r -d '' file; do
  lines=$(wc -l <"$file" | tr -d '[:space:]')
  total_lines=$((total_lines + lines))
  file_count=$((file_count + 1))
done < <(
  find . \( -name node_modules -type d -prune \) -o \( -name '*.ts' -type f -print0 \)
)

echo "Каталог: $(pwd)"
echo "Файлов .ts: $file_count"
echo "Строк кода (wc -l): $total_lines"
