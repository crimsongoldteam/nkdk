#!/bin/bash

# Скрипт переименовывает все .ts файлы:
# exportToXML -> toYAML
# importFromXML -> fromXML
# в директории packages/core/

set -e

BASE_DIR="/Users/nikita/git/nakidka-core/packages/core/"

echo "Переименование файлов..."

# exportToXML -> toYAML
find "$BASE_DIR" -name "*exportToXML*.ts" -print0 | while IFS= read -r -d '' file; do
    new_file="${file//exportToXML/toXML}"
    mv "$file" "$new_file"
    echo "Переименован: $file -> $new_file"
done

# importFromXML -> fromXML
find "$BASE_DIR" -name "*importFromXML*.ts" -print0 | while IFS= read -r -d '' file; do
    new_file="${file//importFromXML/fromXML}"
    mv "$file" "$new_file"
    echo "Переименован: $file -> $new_file"
done

echo "Готово!"
