# Metadata Knowledge Index

Этот индекс обязателен перед любыми изменениями в `packages/core/metadata/**`.

Читай только документы, относящиеся к текущей задаче. Если задача затрагивает несколько пунктов, применяй все соответствующие разделы.

## Всегда

- `sources-of-truth.md` — источники истины, приоритет XML/XSD/MCP/ru-en-map/соседей.

## Если меняешь `rules.ts`, `types.ts`, фикстуры или тесты metadataItem

- `metadata-item-implementation.md`
- `round-trip-cycle.md`
- `registries.md`

## Если добавляешь или исследуешь новый прикладной объект

- `object-research.md`
- `sources-of-truth.md`
- `registries.md`

## Если работа касается YAML

- `yaml-contract.md`
- `round-trip-cycle.md`

## Если чинится round-trip

- `round-trip-cycle.md`
- При расхождении в чужом metadataItem остановись и зафиксируй фрагмент, не правь чужой `rules.ts` без отдельного решения пользователя.

## Переходные источники

До полного переноса подробные шаблоны остаются в `.agents/skills/_shared/metadata/`:

- `.agents/skills/_shared/metadata/rules.md`
- `.agents/skills/_shared/metadata/types.md`
- `.agents/skills/_shared/metadata/fixtures-data.md`
- `.agents/skills/_shared/metadata/tests.md`
- `.agents/skills/_shared/metadata/io-tests.md`
- `.agents/skills/_shared/metadata/scripts.md`

Если `knowledge` и `_shared` расходятся, для обязательных правил поведения приоритет у `knowledge`; для шаблонов кода и тестов используй `_shared`.
