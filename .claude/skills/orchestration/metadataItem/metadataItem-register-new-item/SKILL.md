---
name: metadataItem-register-new-item
description: Где регистрировать новый metadataItem
---

Используй этот скилл, когда нужно быстро и без пропусков зарегистрировать новый `metadataItem`.

## Обязательные точки регистрации

1. Тип в реестре metadataItem:
   - `packages/core/metadata/orchestration/metadataItem/registry.ts`
   - добавь новый ключ в `MetadataItemTypeRegistry`:
     - `metadata: <Type>`
     - `yaml: <TypeYAML>`
     - опционально `enterprise: <TypeEnterprise>`
     - опционально `yamlTyped: <TypeTypedYAML>` (для typed form elements)

2. Правило объекта:
   - `<object>/rules.ts` рядом с типом
   - объявление вида:
     - `itemType: "<SameNameAsRegistryKey>"`
     - `... as const satisfies MetadataItemRule`
   - в `properties` не указывай `xml`, если тег в XML совпадает с дефолтом от ключа (camelCase со строчной первой буквой → `capitalize(ключ)`); см. skill `metadataItem-rules`.

3. Side-effect подключение конвертеров (иначе регистрация не сработает при использовании пакета):
   - для форм: `packages/core/metadata/forms/index.ts`
   - для прикладных объектов: `packages/core/metadata/appliedObjects/index.ts`
   - для элементов формы: `packages/core/metadata/forms/elements/index.ts`

## Для element metadataItem (дополнительно)

1. В `rules.ts` элемента вызови `registerElementRule(itemType, rules)`.
2. Если элемент участвует как значение свойства через property-type, добавь `registerElementAsType(...)`.
3. Убедись, что `rules.ts` элемента импортируется в `packages/core/metadata/forms/elements/index.ts`.

## Минимальный checklist перед PR

1. `itemType` совпадает во всех местах (`types.ts`, `rules.ts`, `registry.ts`).
2. Есть импорты конвертеров `fromXML/fromYAML/toXML/toYAML` в нужном index-файле.
3. Для `enterprise`-экспорта тип содержит `enterprise` в `MetadataItemTypeRegistry`.
4. Добавлены тесты конвертеров на fixture-данных; для сценария **full** эталон в `__fixtures__/data.ts` — через `satisfies Required<…>` (например `Required<DynamicList>`), см. `core-tests-general`.

## Как понять, что забыта регистрация

- Ошибки вида `Unknown element type: ...` в runtime.
- Тип не выводится через `ToYAML`/`ToMetadata`/`ToEnterprise`.
- Конвертеры не вызываются, хотя файлы существуют.
