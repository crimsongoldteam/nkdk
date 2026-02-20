#!/bin/bash

# Скрипт переименовывает все .ts файлы:
# exportToEnterprise -> toYAML
# importFromEnterprise -> fromYAML
# в директории packages/core/

set -e

BASE_DIR="/Users/nikita/git/nakidka-core/packages/core/"

echo "Переименование файлов..."

# exportToEnterprise -> toYAML
find "$BASE_DIR" -name "*exportToEnterprise*.ts" -print0 | while IFS= read -r -d '' file; do
    new_file="${file//exportToEnterprise/toYAML}"
    mv "$file" "$new_file"
    echo "Переименован: $file -> $new_file"
done

# importFromEnterprise -> fromYAML
find "$BASE_DIR" -name "*importFromEnterprise*.ts" -print0 | while IFS= read -r -d '' file; do
    new_file="${file//importFromEnterprise/fromYAML}"
    mv "$file" "$new_file"
    echo "Переименован: $file -> $new_file"
done

echo "Готово!"
