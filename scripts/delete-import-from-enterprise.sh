#!/bin/bash

# Скрипт удаляет все файлы importFromEnterprise.ts в packages/core/metadata/forms/elements
# КРОМЕ autoCommandBar/importFromEnterprise.ts

set -e

BASE_DIR="/Users/nikita/git/nakidka-core/packages/core/metadata/forms/elements"

echo "Удаление файлов importFromEnterprise.ts (кроме autoCommandBar)..."

# Удалить корневой файл importFromEnterprise.ts
if [ -f "$BASE_DIR/importFromEnterprise.ts" ]; then
    rm "$BASE_DIR/importFromEnterprise.ts"
    echo "Удален: $BASE_DIR/importFromEnterprise.ts"
fi

# Найти и удалить все importFromEnterprise.ts в поддиректориях (кроме autoCommandBar)
find "$BASE_DIR" -name "importFromEnterprise.ts" -not -path "*/autoCommandBar/*" -print0 | while IFS= read -r -d '' file; do
    rm "$file"
    echo "Удален: $file"
done

echo "Готово!"
