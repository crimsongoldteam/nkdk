---
name: metadataItem-register-property-rule
description: Регистрация одиночного metadataItem как типа свойства через registerMetadataItemRule в packages/core/metadata/orchestration/metadataItem. Используй, когда свойство в rules родителя имеет type, который сам является целым объектом с MetadataItemRule (не коллекция и не form element).
---

Используй этот скилл, когда нужно подключить **один** вложенный объект метаданных как значение свойства (`PropertyRule.type`), чтобы работали стандартные `importPropertyFromXML` / `exportPropertyToXML` / `importPropertyFromYAML` / `exportPropertyToYAML` для этого типа.

## Когда registerMetadataItemRule, а не другое

| Ситуация | Что вызывать |
|----------|----------------|
| Одно значение свойства — объект по `MetadataItemRule` (например, динамический список настройки формы) | `registerMetadataItemRule` |
| Коллекция именованных элементов (массив в XML, объект ключей в YAML) | `registerMetadataItemCollectionRule` — см. skill `metadataCollection-register-rule` |
| Элемент формы как тип свойства (узел с `id`, NKDK) | `registerElementAsType` — `packages/core/metadata/orchestration/formElement/ruleFactory.ts` |

## Что делает registerMetadataItemRule

Автоматически регистрирует в `PropertyTypeRegistry` четыре операции для указанного `propertyType`:

1. `importFromXML` — через `importMetadataItemFromXML`
2. `importFromYAML` — через `importMetadataItemFromYAML`
3. `exportToYAML` — через `exportMetadataItemToYAML`
4. `exportToXML` — через `exportMetadataItemToXML`

Реализация разнесена по модулям `packages/core/metadata/orchestration/metadataItem/register*.ts`; фасад — `ruleFactory.ts`.

## Где и как регистрировать

1. Опиши объект в `<object>/rules.ts`: `itemType`, `properties`, `as const satisfies MetadataItemRule`.
2. В **`types.ts` того же объекта** (рядом с типами и side-effect, как у коллекций) добавь:

```ts
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { YourObjectRules } from "./rules"

registerMetadataItemRule({
  propertyType: "YourPropertyType", // тот же ключ, что в PropertyTypeRegistry и в rule родителя: type: "YourPropertyType"
  itemRule: YourObjectRules,
})
```

Пример из проекта — `DynamicList` в `packages/core/metadata/forms/commonObjects/dynamicList/types.ts`.

3. Убедись, что модуль `types.ts` подтягивается через индекс домена (формы, commonObjects и т.д.), иначе регистрация при загрузке пакета не выполнится.

## Обязательные проверки

1. **`propertyType`** объявлен в `PropertyTypeRegistry` (`packages/core/metadata/orchestration/property/registry.ts`): ключ совпадает со строкой в `registerMetadataItemRule` и с `type` у свойства в `rules` родителя.
2. **`itemRule.itemType`** зарегистрирован в `MetadataItemTypeRegistry` (`packages/core/metadata/orchestration/metadataItem/registry.ts`) — см. skill `metadataItem-register-new-item`.
3. Все `type` внутри `itemRule.properties` существуют в `PropertyTypeRegistry` (вложенные Filter, ConditionalAppearance и т.д.).

## Тесты

Имеет смысл прогнать свойство через общие хелперы `~/tests/property/importPropertyFromXML`, `exportPropertyToXML`, `exportPropertyToYAML` и при необходимости отдельные `*.test.ts` рядом с объектом — по тем же паттернам, что в `CLAUDE.md` для property.

## Частые ошибки

1. Регистрация только в `rules.ts` без вызова `registerMetadataItemRule` — тип в YAML/XML не разбирается как metadata item.
2. Несовпадение строки `propertyType` с ключом в `PropertyTypeRegistry` или с `type` в rule родителя.
3. `types.ts` с вызовом не импортируется из индекса пакета — реестр типов пустой в runtime.

## Критерий готовности

- Одиночное вложенное значение конвертируется XML ↔ metadata ↔ YAML через общий пайплайн свойств.
- `pnpm type-check` в `packages/core` проходит.
