# Спецификация: перевод `commonObjects/predefined/` на `rules.ts`

Дата: 2026-04-25

## Контекст

Объект `packages/core/metadata/commonObjects/predefined/` сейчас реализован «вручную»:

- `types.ts` — отдельные интерфейсы `Predefined`, `PredefinedXML`, `PredefinedYAML`, коллекции и `TypeBox`-схема для YAML.
- `fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts`, `toJSONSchema.ts` — пять файлов с императивной конвертацией; каждый регистрирует свою функцию через `registerTypeRule("Predefined", ...)`.
- `rules.ts` содержит **только** инфраструктуру внешнего файла: константу `PredefinedDataEnvelope` и глобальный реестр `externalFileEnvelopes`, через который оркестратор узнаёт корневой XML-тег `<PredefinedData>` и его атрибуты.

Соседний `commonObjects/predefinedItem/` уже переведён на декларативный `rules.ts` через
`registerMetadataItemRule`/`registerMetadataItemCollectionRule`. Существует тип-коллекция
`PredefinedItemCollection` с `itemRule: PredefinedItemRules`, `xmlElement: "Item"`, `keyField: "name"` —
он используется как рекурсивное `childItems` внутри элемента.

Текущая модель `Predefined` плоская (без `childItems`), хотя в реальной XML-структуре `<PredefinedData>`
элементы могут иметь вложенные `<ChildItems>`. Существующая фикстура каталога
(`appliedObjects/metadataCatalog/__fixtures__/sync/xml/Ext/Predefined.xml`) — плоская, поэтому регрессии
на уровне round-trip-теста `metadataCatalog` не будет.

## Цель

Привести `commonObjects/predefined/` к декларативной форме `rules.ts` (как `predefinedItem/`), удалить
ручные конвертеры и глобальный реестр `externalFileEnvelopes`. Концептуально: `Predefined` — это
**одиночный объект-обёртка внешнего файла**, содержащий внутри коллекцию `PredefinedItemCollection`.

Дополнительно: переименовать существующий маркер `MetaDataObject` в более общее `XMLRoot`, чтобы он
описывал корневой XML-тег и его атрибуты для любого item-rule (а не только обёртки прикладного объекта).

## Архитектурные решения

### 1. `Predefined` — это `MetadataItemRule`, а не тип-коллекция

Концептуально `Predefined` — это **обёртка-файл**, а не сама коллекция. Внутри обёртки лежит коллекция
типа `PredefinedItemCollection`. Эти две сущности различаются в XML-семантике:

- `Predefined` — корень внешнего файла `Ext/Predefined.xml` с тегом `<PredefinedData>` и его xmlns.
- `PredefinedItemCollection` — вложенная коллекция, использующаяся как `childItems` в `PredefinedItem`
  (заворачивается в `<ChildItems>`).

Item-rule содержит ровно два свойства:

- маркер `xmlRoot: { type: "XMLRoot", container: "PredefinedData", rootAttributes: {...}, forReferenceOnly: true }`;
- содержательное `items: { type: "PredefinedItemCollection", yamlInline: true }`.

### 2. Маркер `XMLRoot` (бывший `MetaDataObject`)

Существующий property-тип `"MetaDataObject"` переименовывается в `"XMLRoot"`. Семантика сохраняется:
оркестратор `metadataItem/fromXML.ts`/`toXML.ts` ищет в `rule.properties` свойство с типом `"XMLRoot"`,
извлекает из него `container` и `rootAttributes` и оборачивает результат в
`{ [container]: { ...rootAttributes, ...content } }`.

Изменения по миграции:

- Папка `packages/core/metadata/commonObjects/metaDataObject/` → `xmlRoot/`.
- Внутри файлов: интерфейс `MetaDataObjectPropertyRule` → `XMLRootPropertyRule`,
  функции `importMetaDataObjectFromXML`/`exportMetaDataObjectToXML` → `importXMLRootFromXML`/`exportXMLRootToXML`,
  string-литерал `"MetaDataObject"` → `"XMLRoot"`.
- В `MetadataCatalogRules.properties.metaDataObject` → переименовать ключ в `xmlRoot`, поле `type` —
  в `"XMLRoot"`.
- В `orchestration/property/types.ts` — обновить дискриминатор и union.

### 3. Флаг `yamlInline` на `BasePropertyRule`

Новый опциональный флаг свойства `yamlInline?: boolean`. Семантика: когда у `MetadataItemRule` ровно
**одно** содержательное свойство (то есть свойство без `forReferenceOnly: true`) помечено
`yamlInline: true`, при сериализации в YAML и в JSON-схему этот item-объект **не оборачивается**
ключом данного свойства, а представляется значением свойства напрямую. Если в правиле больше
одного `yamlInline: true`-свойства, оркестратор кидает ошибку на этапе регистрации.

Поведение оркестратора:

- `exportMetadataItemToYAML` — после стандартной сборки YAML-объекта проверяет: если ровно одно
  не-reference свойство имеет `yamlInline: true`, возвращает значение этого свойства. Иначе — обычный
  объект.
- `importMetadataItemFromYAML` — симметрично: всё значение YAML-узла кладётся в инлайн-свойство.
- `exportMetadataItemToJSONSchema` — возвращает схему типа инлайн-свойства, а не объекта со всеми
  свойствами.

**Скоп флага — только YAML и JSON-схема.** Модель данных и XML-сериализация **не трогаются**: в модели
у `Predefined` остаётся обычная структура `{ items: PredefinedItem[] }`; в XML — стандартная обёртка
через маркер `XMLRoot`.

Эффект:

```yaml
# Свойства.yaml каталога — без лишнего уровня:
Предопределенные:
  ПредопределенноеЗначение:
    Код: "000000001"
    Наименование: Предопределенное значение
    ЭтоГруппа: false
```

```ts
// Модель данных — со свойством items (приемлемо):
catalog.predefined?.items[0].name
```

```xml
<!-- XML внешнего файла — без изменений против эталона: -->
<PredefinedData xmlns="..." version="2.20">
  <Item ...>...</Item>
</PredefinedData>
```

### 4. Удаление инфраструктуры `externalFileEnvelopes`

Глобальный реестр `externalFileEnvelopes` и интерфейс `ExternalFileEnvelope` удаляются. Метаданные
внешнего файла (корневой тег + xmlns) живут только в `rules.ts` соответствующего объекта — через
маркер `XMLRoot` внутри его item-rule.

Оркестраторы `orchestration/appliedObject/convertFromXML.ts` и `syncToXML.ts` перестают читать
`externalFileEnvelopes`. Свойства с `filePath` обрабатываются как обычные item-типы:

- При импорте: оркестратор читает файл, парсит XML, передаёт результат в `importMetadataItemFromXML`
  с правилом типа этого свойства. Извлечение содержимого корневого тега и пропуск маркер-свойства —
  стандартная логика item-обработчика.
- При экспорте: симметрично через `exportMetadataItemToXML`. Маркер `XMLRoot` оборачивает результат
  в нужный корневой тег с атрибутами.

### 5. `AdditionalIndex` — мигрируется по тому же паттерну

Сейчас `commonObjects/additionalIndex/` тоже использует `externalFileEnvelopes` (для файла
`Ext/AdditionalIndexes.xml`). После удаления реестра он должен быть переведён на ту же схему:
полноценный `AdditionalIndexRules: MetadataItemRule` с маркером `XMLRoot` (`container:
"AdditionalIndexes"`) и инлайн-коллекцией. **Включается в эту же миграцию** (без него
`externalFileEnvelopes` не получится удалить).

### 6. Архитектурные инварианты слоя `orchestration` — в `.claude/architecture-orchestration.md`

Создаётся отдельный файл `.claude/architecture-orchestration.md` с фиксацией инвариантов слоя
оркестрации. Скоп — минимальный, под текущие изменения, с заделом на расширение в будущих задачах.
Содержание:

- Регистрация типов: `registerMetadataItemRule` и `registerMetadataItemCollectionRule`, что они
  делают и какие функции автоматически вешают через `registerTypeRule`.
- Маркер `XMLRoot`: семантика, поля `container`/`rootAttributes`, как оркестратор его находит и
  обрабатывает.
- Обработка свойств с `filePath`: что делают `convertAppliedObjectFromXML`/`syncAppliedObjectToXML`.
- Флаг `yamlInline`: семантика и зона действия (только YAML и JSON-схема).
- Поток данных при импорте и экспорте прикладного объекта (краткая последовательность вызовов).

В `.claude/CLAUDE.md` добавляется одна строка-ссылка: «Архитектурные инварианты слоя `orchestration` —
см. [`architecture-orchestration.md`](architecture-orchestration.md). Перед изменениями в
`packages/core/metadata/orchestration/` обязательно прочитать.»

## Изменения по файлам

### Расширения оркестрации

- `packages/core/metadata/orchestration/property/types.ts` — у `BasePropertyRule` добавляется
  `yamlInline?: boolean`. В дискриминированном union строковый литерал `"MetaDataObject"` заменяется
  на `"XMLRoot"`. Импорт типа `MetaDataObjectPropertyRule` → `XMLRootPropertyRule`.
- `packages/core/metadata/orchestration/metadataItem/fromXML.ts` — поиск маркера переключается с
  `p.type === "MetaDataObject"` на `p.type === "XMLRoot"`.
- `packages/core/metadata/orchestration/metadataItem/toXML.ts` — то же самое.
- `packages/core/metadata/orchestration/metadataItem/toYAML.ts` — после сборки YAML-объекта новая
  проверка: если есть ровно одно не-reference свойство с `yamlInline: true`, возвращаем его значение
  напрямую.
- `packages/core/metadata/orchestration/metadataItem/fromYAML.ts` — симметрично: если у правила есть
  такое свойство, всё YAML-значение кладётся в него.
- `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts` — то же на уровне схемы:
  возвращается схема инлайн-свойства, а не общая объектная.

### Переименование `MetaDataObject` → `XMLRoot`

- `packages/core/metadata/commonObjects/metaDataObject/` — переименовать папку в `xmlRoot/`.
- В файлах внутри:
  - `types.ts` — `MetaDataObjectPropertyRule` → `XMLRootPropertyRule`, `type: "MetaDataObject"` →
    `type: "XMLRoot"`.
  - `fromXML.ts`, `fromXML.test.ts` — функции `importMetaDataObjectFromXML` →
    `importXMLRootFromXML`, `registerTypeRule("MetaDataObject", ...)` →
    `registerTypeRule("XMLRoot", ...)`.
  - `toXML.ts`, `toXML.test.ts` — симметрично.
- `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts` — ключ свойства `metaDataObject` →
  `xmlRoot`, `type: "MetaDataObject"` → `type: "XMLRoot"`.

### Перепись `commonObjects/predefined/`

Новый `rules.ts`:

```ts
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const PredefinedRules = {
  itemType: "Predefined",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "PredefinedData",
      rootAttributes: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/predef",
        "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
        "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "_xsi:type": "CatalogPredefinedItems",
        _version: "2.20",
      },
      forReferenceOnly: true,
    },
    items: {
      type: "PredefinedItemCollection",
      yamlInline: true,
    },
  },
} as const satisfies MetadataItemRule
```

Новый `types.ts` (типы выводятся из правил):

```ts
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { PredefinedRules } from "./rules"

export type Predefined = MetadataTypeByRule<typeof PredefinedRules>
export type PredefinedYAML = YAMLTypeByRule<typeof PredefinedRules>

registerMetadataItemRule({
  propertyType: "Predefined",
  itemRule: PredefinedRules,
})
```

`index.ts` — `import "./types"` (триггер регистрации).

**Удаляются:** `fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts`, `toJSONSchema.ts`,
константа `PredefinedDataEnvelope`, реестр `externalFileEnvelopes`, интерфейс `ExternalFileEnvelope`.

### `commonObjects/additionalIndex/`

Аналогичная переписка: item-rule с маркером `XMLRoot` (container `"AdditionalIndexes"`,
соответствующие xmlns), инлайн-коллекция. Удаление `AdditionalIndexesEnvelope`.

### Оркестратор `orchestration/appliedObject/`

- `convertFromXML.ts` — удаление импорта `externalFileEnvelopes`. Цикл по свойствам с `filePath`
  использует `importMetadataItemFromXML` с правилом типа свойства (через registry правил metadataItem).
- `syncToXML.ts` — симметрично: `exportMetadataItemToXML`. Логика merge `_id` из reference-файла
  сохраняется (она независима от envelope).

### `appliedObjects/metadataCatalog/`

- `rules.ts` — без структурных изменений (свойство `predefined: { type: "Predefined", filePath, yaml }`
  остаётся; меняется только `metaDataObject` → `xmlRoot`).
- `types.ts` — обновить импорты: убрать `PredefinedItemsXML/PredefinedItemsYAML`, использовать
  выведенные типы из `commonObjects/predefined/`.

### `orchestration/property/registry.ts`

Обновить запись для `"Predefined"` — теперь это item-тип, выводимый из `PredefinedRules`.

### Документация

- `.claude/architecture-orchestration.md` — новый файл, см. секцию «Архитектурные инварианты» выше.
- `.claude/CLAUDE.md` — добавить ссылку и обязательство читать перед изменениями в `orchestration/`.

## Тестирование

- `commonObjects/predefined/__fixtures__/full.xml` — уже существует, содержит `<ChildItems>` с
  вложенностью. Используется как источник round-trip-фикстуры.
- Добавляются тесты `commonObjects/predefined/fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`,
  `toYAML.test.ts` (по образцу `commonObjects/predefinedItem/`).
- Существующие тесты `metadataCatalog/syncToXML.test.ts` и `convertFromXML.test.ts` должны проходить
  без изменений в фикстурах: эталонный `Ext/Predefined.xml` каталога — плоский, без `<ChildItems>`,
  и YAML без `Элементы` интерпретируется как набор элементов без вложенности.
- Существующие тесты `commonObjects/metaDataObject/` (после переименования — `xmlRoot/`) — обновить
  под новые имена.
- `pnpm test` — должен пройти полностью перед закрытием задачи.

## Что не входит в эту работу

- Расширение модели `PredefinedItem` за пределы существующих полей. Изменения внутри
  `commonObjects/predefinedItem/rules.ts` не предполагаются.
- Полный обзор слоя `orchestration` в `.claude/architecture-orchestration.md` — фиксируем только
  то, что трогаем; остальные инварианты дополним по мере следующих изменений.
- Введение flatten-механизмов для модели данных или XML — `yamlInline` действует только на YAML и
  JSON-схему.
