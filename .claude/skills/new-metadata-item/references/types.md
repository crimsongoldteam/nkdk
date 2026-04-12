# Работа с типами

Типы хранятся в файле `types.ts` в каталоге объекта метаданных и обычно выводятся из `rules.ts`.

## Инструкция

0. Для описания типов потребуются файл правил `rules.ts` и строка `propertyType` для регистрации в оркестрации.
1. Создай новый `types.ts` в каталоге объекта метаданных.
2. Опиши внутренний тип (`<ObjectName>`) через `MetadataTypeByRule<typeof <ObjectName>Rules>`.
3. Опиши YAML-тип (`<ObjectName>YAML`) через `YAMLTypeByRule<typeof <ObjectName>Rules>`.
4. Зарегистрируй тип через `registerMetadataItemRule({ propertyType, itemRule })`.

## Пример

```typescript
export type Filter = MetadataTypeByRule<typeof FilterRules>
export type FilterYAML = YAMLTypeByRule<typeof FilterRules>

registerMetadataItemRule({
  propertyType: "Filter",
  itemRule: FilterRules,
})
```
