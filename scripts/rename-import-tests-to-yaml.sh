#!/bin/bash

# Скрипт переименовывает все файлы importFromEnterprise.test.ts в fromYAML.test.ts
# в директории packages/core/metadata/forms/elements

set -e

BASE_DIR="/Users/nikita/git/nakidka-core/packages/core/metadata/forms/elements"

echo "Переименование файлов importFromEnterprise.test.ts -> fromYAML.test.ts..."

# Найти и переименовать все importFromEnterprise.test.ts
find "$BASE_DIR" -name "importFromEnterprise.test.ts" -print0 | while IFS= read -r -d '' file; do
    new_file="${file/importFromEnterprise.test.ts/fromYAML.test.ts}"
    mv "$file" "$new_file"
    echo "Переименован: $file -> $new_file"
done

echo "Готово!"
