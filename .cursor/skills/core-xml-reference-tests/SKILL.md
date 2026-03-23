---
name: core-xml-reference-tests
description: >-
  Эталонный XML в toXML-тестах packages/core: mockContextFromXML({ forReference: true }),
  importPropertyFromXML / importElementFromXML, testExportPropertyToXML, referenceMetadata,
  getOrderedKeysToXML. Читай при отладке порядка узлов и правках exportElementToXML.ts /
  importPropertyFromXML.ts. Общая схема фикстур — скил tests/.
---

# Эталонный XML и порядок полей в toXML-тестах

Общая схема фикстур и пар from/to — [скил `tests/`](../tests/SKILL.md) (`core-properties-tests`).

## Назначение

Для сравнения **строки результата** с **эталонным XML** тесты не полагаются только на порядок полей в `rules.ts`: порядок узлов в выгрузке должен совпасть с эталонным файлом-фикстурой.

Хелперы тестов: **`packages/core/tests/exportElementToXML.ts`** (`testExportPropertyToXML`, эталон и `referenceMetadata`); **`packages/core/tests/importPropertyFromXML.ts`** (`testImportPropertyFromXML` для fromXML). Сами **`importPropertyFromXML` / `importElementFromXML`** с `mockContextFromXML({ forReference: true })` подключаются из `~/metadata/orchestration` (использование — в `exportElementToXML.ts`).

## Цепочка: эталонный файл → импорт с `forReference` → экспорт с `referenceMetadata`

1. По пути `path` читается **тот же файл**, что и ожидаемый результат: строка целиком (`expectedResult`) и разбор в объект (`readAndParseXMLFile`), из которого берётся фрагмент под нужный тег (`itemType` или корень свойства).
2. Фрагмент разбирается **`importElementFromXML` / `importPropertyFromXML`** в контексте **`mockContextFromXML({ forReference: true })`**. Флаг **`context.fromXML.forReference`** включает режим эталона: импорт учитывает служебные поля и **порядок свойств как в исходном XML**.
3. При экспорте в **`exportElementToXML` / `exportPropertyToXML`** этот объект передаётся как **`referenceElement` / `referenceMetadata`**. В `exportPropertiesToXML` функция **`getOrderedKeysToXML`** (см. `metadata/orchestration/property/helpers.ts`) сопоставляет порядок ключей правила с порядком полей в эталоне, чтобы **`xmlExport`** выдал XML в том же порядке узлов, что и оригинальная фикстура.

**Итог:** эталонный файл задаёт и ожидаемую строку, и **референс для порядка полей** при сериализации.

## Примеры в репозитории

- `testExportPropertyToXML` / эталон из `packages/core/tests/fixtures` — `packages/core/metadata/forms/elements/contextMenu/toXML.test.ts` (см. раздел **toXML** в [tests/](../tests/SKILL.md)).

## Связанные скилы

- [tests/](../tests/SKILL.md) — структура `fromXML` / `toXML` тестов и фикстур
- [nakidka-core](../nakidka-core/SKILL.md) — контекст репозитория
- [rules](../rules/SKILL.md) — поле **`forReferenceOnly`** в правиле (отдельно от `context.fromXML.forReference` в тестах)
