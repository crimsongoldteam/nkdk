# Архитектура слоя `orchestration`

Документ фиксирует ключевые инварианты слоя `packages/core/metadata/orchestration/`. **Перед изменениями в этом слое — прочитать и при необходимости обновить.**

## Регистрация типов

Каждый property-тип регистрируется через одну из двух фабрик:

- **`registerMetadataItemRule({ propertyType, itemRule })`** — регистрирует тип как полноценный объект (`MetadataItemRule`). Автоматически вешает обработчики `importFromXML`/`exportToXML`/`importFromYAML`/`exportToYAML` через единый реестр.
- **`registerMetadataItemCollectionRule({ propertyType, itemRule, xmlElement, keyField, yamlAsArray? })`** — регистрирует тип как коллекцию таких объектов. Автоматически вешает те же обработчики плюс `exportToJSONSchema`.

Сами обработчики хранятся в едином реестре `registerTypeRule(type, role, value)` (см. `orchestration/formElement/factory.ts`). По типу можно достать как функцию-обработчик, так и произвольное значение.

Тип property должен быть зарегистрирован в трёх местах TypeScript:
- `orchestration/property/registry.ts` — `PropertyTypeRegistry` (для `BasePropertyRule.type`),
- `orchestration/metadataItem/registry.ts` — `MetadataItemTypeRegistry` (для `MetadataItemRule.itemType`, только для item-типов),
- `orchestration/property/types.ts` — union `PropertyRule` (если тип имеет специфические поля сверх `BasePropertyRule`).

## Маркер `XMLRoot`

Свойство-маркер с типом `"XMLRoot"`, помеченное `forReferenceOnly: true`, описывает корневой XML-тег item-rule и его атрибуты:

```ts
xmlRoot: {
  type: "XMLRoot",
  container: "Catalog",        // или "PredefinedData", "AdditionalIndexes" и т.п.
  rootAttributes: { _xmlns: "...", _version: "2.20", ... },
  forReferenceOnly: true,
  isFileRoot?: true,           // см. ниже
}
```

`metadataItem/fromXML.ts`/`toXML.ts` ищут это свойство в `rule.properties` и используют его при импорте/экспорте.

Поле `isFileRoot?: true` различает два режима:

- **без `isFileRoot`** — корневой тег XML = `<MetaDataObject>`, `container` — внутренний тег (`<Catalog>`, `<DocumentNumerator>`); используется для прикладных объектов 1С.
- **`isFileRoot: true`** — корневой тег XML = `container` напрямую (`<PredefinedData>`, `<AdditionalIndexes>`); используется для внешних файлов вроде `Ext/Predefined.xml`.

## Свойства с `filePath`

Свойство item-rule с заданным `filePath: string` означает, что значение хранится во внешнем XML-файле (например, `Ext/Predefined.xml`). Тип такого свойства должен быть зарегистрирован как `MetadataItemRule` через `registerMetadataItemRule` и иметь маркер `XMLRoot` с `isFileRoot: true`.

Оркестраторы `appliedObject/{convertFromXML,syncToXML}.ts` обрабатывают `filePath`-свойства как обычные item-типы через `importPropertyFromXML`/`exportPropertyToXML`. Под капотом сериализатор сам надевает обёртку корневого тега и xmlns-атрибутов.

При экспорте `syncToXML.ts` дополнительно читает эталонный внешний файл (`referenceDir/<filePath>`), импортирует его как модель и передаёт в `exportPropertyToXML` через `referenceMetadata`. Это:
- сохраняет точный порядок полей по эталону,
- подмешивает атрибуты, помеченные `forReferenceOnly` (например, id-атрибут).

## Свойства с типом `ChildFormNames`

Свойство правила с типом `ChildFormNames` совмещает две роли:

1. **Сериализация в основной XML.** Даёт тег `<ChildObjects><Form>…</Form></ChildObjects>` в XML объекта. Реализация — обработчик `exportToXML`, зарегистрированный на типе.

2. **Синхронизация файлов форм.** Обработчики `syncExternalToXML`/`syncExternalFromXML`, зарегистрированные на типе, сканируют папку `nkdkDir/<folderName>` (на nkdk-стороне) или `xmlDir/<name>/Forms/` (на XML-стороне) и для каждой формы делегируют работу `syncFormToXML` / `convertFormFromXML`. Формы внутри одного объекта обрабатываются **последовательно**.

Сигнатура `SyncExternalToXMLFunction` / `SyncExternalFromXMLFunction` включает поля `name: string` (имя объекта) и `referenceDir?: string` (родитель эталонной директории объекта, для round-trip). Эти поля заполняет `appliedObject/syncToXML.ts` / `appliedObject/convertFromXML.ts`. Хуки `Module`/`Help`/`Template` их игнорируют.

## Флаг `yamlInline`

Опциональный флаг свойства `yamlInline?: true` на `BasePropertyRule`. Применяется только в YAML и JSON-схеме (модель и XML — без изменений).

Семантика: если у `MetadataItemRule` ровно одно содержательное свойство (без `forReferenceOnly`) с `yamlInline: true`, сериализация в YAML/JSON-схему использует значение этого свойства напрямую, без обёртки. Импорт симметричен. При наличии более одного `yamlInline`-свойства оркестратор кидает ошибку.

Реализация — в утилите `metadataItem/yamlInline.ts::findInlineProperty(rule)`, переиспользуется из `toYAML.ts`/`fromYAML.ts`/`toJSONSchema.ts`.

Типичный сценарий — внешний файл-обёртка (например, `Predefined`), где маркер `xmlRoot` несёт XML-обёртку, а единственное содержательное свойство `items: PredefinedItemCollection` помечено `yamlInline: true`, чтобы YAML каталога не получал лишнего уровня `items:`.

## Поток данных

**`convertAppliedObjectFromXML` (`appliedObject/convertFromXML.ts`):**
1. Читает основной XML объекта (`<inputDir>/<name>.xml`), парсит, передаёт в `importMetadataItemFromXML` с правилом объекта.
2. Для каждого свойства правила с `filePath`: читает внешний файл, передаёт распарсенный XML в `importPropertyFromXML(propRule)`. Маркер `XMLRoot` (с `isFileRoot: true`) сам снимает обёртку корневого тега.
3. Вызывает обработчики `syncExternalFromXML` для свойств с собственной логикой синхронизации (`Module`, `Help`, `Template`).
4. Записывает `Свойства.yaml` через `exportMetadataItemToYAML`.

**`syncAppliedObjectToXML` (`appliedObject/syncToXML.ts`):**
1. Читает `Свойства.yaml`, импортирует через `importMetadataItemFromYAML`.
2. Через `exportMetadataItemToXML` с правилом объекта собирает основной XML; `referenceData` подгружается из эталонного XML.
3. Для свойств с `filePath`: импортирует эталон внешнего файла как `referenceValue`, экспортирует модель через `exportPropertyToXML` с `referenceMetadata: referenceValue`. Записывает результат во внешний файл.
4. Вызывает `syncExternalToXML` для `Module`/`Help`/`Template`.
