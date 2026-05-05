# Работа с типами

Типы хранятся в файле `types.ts` в каталоге объекта метаданных и обычно выводятся из `rules.ts`.

## Инструкция

0. Для описания типов потребуются файл правил `rules.ts` и строка `propertyType` для регистрации в оркестрации.
1. Создай новый `types.ts` в каталоге объекта метаданных.
2. Опиши внутренний тип (`<ObjectName>`) через `MetadataTypeByRule<typeof <ObjectName>Rules>`.
3. Опиши YAML-тип (`<ObjectName>YAML`) через `YAMLTypeByRule<typeof <ObjectName>Rules>`.
4. Зарегистрируй тип через `registerMetadataItemRule({ propertyType, itemRule })` (для одиночного объекта) или `registerMetadataItemCollectionRule` (для коллекции — см. развилку ниже).

## Одиночный объект vs коллекция

Развилка вытекает из формы данных:

- **Одиночный объект** (в модели: `T`, в XML: один тег, в YAML: один ключ) — `registerMetadataItemRule({ propertyType, itemRule })`. Примеры: `MetadataDocumentNumerator`, `Order`, `Filter`, `StructureItemGroup`.

- **Коллекция** (в модели: `T[]`, в XML: повторяющиеся теги, в YAML: `Record<keyField, T>`) — `registerMetadataItemCollectionRule({ propertyType, itemRule, xmlElement, keyField })`. Параметры: `xmlElement` — имя повторяющегося XML-тега (например, `"Command"`), `keyField` — поле объекта, используемое как YAML-ключ (обычно `"name"`). Примеры: `MetadataCommands` (`metadataCommand/register.ts`), `MetadataAttributes` (`metadataAttribute/register.ts`), `MetadataTabularSections` (`metadataTabularSection/register.ts`).

Если выбрать не тот регистратор — тесты молча будут падать на YAML-импорте / экспорте, потому что оркестрация не сможет собрать/разобрать коллекцию по ключам.

## Пример

```typescript
export type Filter = MetadataTypeByRule<typeof FilterRules>
export type FilterYAML = YAMLTypeByRule<typeof FilterRules>

registerMetadataItemRule({
  propertyType: "Filter",
  itemRule: FilterRules,
})
```
