# MetadataDocument — закрыть пробелы round-trip

**Дата:** 2026-04-26
**Статус:** утверждён

## Контекст

`MetadataDocument` (`packages/core/metadata/appliedObjects/metadataDocument/`) частично реализован: есть `rules.ts` (~50 свойств), `types.ts`, `defaults.ts`, `fromYAML.ts`, `toJSONSchema.ts`. Но полный round-trip XML→YAML→XML побайтово **не воспроизводит** исходный XML. Причины зафиксированы в memory `project_document_rules_gaps.md` и в комментарии `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts:84`.

Соседи (`metadataSequence`, `metadataDocumentNumerator`, `metadataCatalog`) round-trip-чисты — у них есть `xmlRoot`, `internalInfo`, массовые `defaultValueXMLRaw`, унифицированные `xmlParents` без двойной обёртки `["Document", "Properties"]`, а Catalog/Sequence — также `requiredXMLParents`.

Deep Scan свойств родителя (см. чат-сессию 2026-04-26) показал четыре источника истины:
- XSD/XDTO `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, тип `DocumentProperties` (lines 2025–2078) и `DocumentChildObjects` (lines 1974–1980).
- MCP-тип `ОбъектМетаданных: Документ` (русские имена + типы платформы).
- Карта `~/.cache/mcp-bsl/ru-en-map.json` (английские синонимы).
- Фикстуры `__fixtures__/{full,minimal,withNumerator}.xml` и `__fixtures__/sync/ДокументВсеСвойства*`.

## Цель

Привести `MetadataDocument` к round-trip-полноте по образцу `MetadataSequence`/`MetadataCatalog`: после изменений тест `syncToXML.test.ts` для Document должен побайтово воспроизводить `__fixtures__/full.xml` из YAML, а `convertFromXML` — стабильно генерировать YAML из этого XML.

## Не в границах задачи

- **Forms / Templates / Modules / Help / extendedConfigurationObject.** Эти свойства добавляются отдельным PRD-2 «Document — Forms/Templates/Modules/Help». Механизмы (`ChildFormNames`, `ChildTemplateNames`, `Module`, `Help`) уже зарегистрированы в `PropertyRuleTypeKeys` и работают для Catalog — для Document это копирование двух-четырёх свойств, но рекомендуется не смешивать с round-trip-каркасом, чтобы не раздувать диффы.
- **Подчинённые типы** (`Attribute`, `TabularSection`, `Command`, `StandardAttributeDescription`, `MetadataField`, `MetadataItemLinks`, `AdditionalIndex`, `I8nText`, `CharacteristicsDescriptions`) — все уже реализованы как commonObjects/appliedObjects, дополнения не требуются.
- **Реестры** (`MetadataItemTypeRegistry`, `PropertyTypeRegistry`, `PropertyRuleTypeKeys`) — `MetadataDocument` уже зарегистрирован, все нужные типы свойств тоже.
- **`defaults.ts`.** В нём есть несколько runtime-дефолтов, расходящихся с XSD/фикстурой (например, `actionsWritingOnPost: "WriteModified"` против `WriteSelected` в фикстуре). Это runtime-поведение, отдельный вопрос от XML round-trip; не трогаем в этом PRD.

## Архитектура

### Принципы

1. **TS-ключи остаются идиоматичными** (по карте ru-en и текущему `types.ts`). При расхождении с фактическим XML-тегом используется явное `xml: "<XMLTag>"`. YAML-ключ — русский (`yaml: "..."`).
2. **`xmlRoot` + `internalInfo`** — корневые «обёрточные» свойства, как у Sequence/Catalog. Заменяют ручную обёртку `["Document", "Properties"]` в `xmlParents` каждого свойства.
3. **`xmlParents` упрощается** до `["Properties"]` / `["ChildObjects"]` — `xmlRoot` сам подмешивает `<Document>` сверху.
4. **`defaultValueXMLRaw`** заполняется массово для всех пустых тегов, наблюдаемых в `__fixtures__/full.xml` и `minimal.xml`.

### Состав изменений в `rules.ts`

#### Новые свойства

| TS-ключ | XML-тег | YAML-ключ | Тип / правило |
|---|---|---|---|
| `xmlRoot` | (обёртка) | — | `type: "XMLRoot", container: "Document", rootAttributes: V8_MDCLASSES_ROOT, forReferenceOnly: true, toYAML: false, fromYAML: false` |
| `internalInfo` | `InternalInfo` | — | `type: "InternalInfo", xmlParents: [], forReferenceOnly: true, items: [{name:"DocumentObject",category:"Object"},{name:"DocumentRef",category:"Ref"},{name:"DocumentSelection",category:"Selection"},{name:"DocumentList",category:"List"},{name:"DocumentManager",category:"Manager"}]` |
| `numerator` | `Numerator` | `Нумератор` | `type: "string", xmlParents: ["Properties"], referenceScope: { target: "topLevel", allowedTypes: ["Нумератор"] }, defaultValueXMLRaw: ""` |
| `privilegedUnpostingMode` | `UnpostInPrivilegedMode` | `ПривилегированныйРежимПриОтменеПроведения` | `type: "boolean", defaultValueXML: false, xmlParents: ["Properties"]` |

#### Правки существующих свойств

| TS-ключ | Что меняется |
|---|---|
| `actionsWritingOnPost` | добавить `xml: "RegisterRecordsWritingOnPost"` (фикстура — этот тег) |
| `privilegedPostingMode` | добавить `xml: "PostInPrivilegedMode"` |
| `objectBelonging` | добавить `toYAML: false, fromYAML: false, defaultValueYAML: "Native"` (по Sequence) |
| `additionalIndexes` | заменить `xmlParents: documentProperties` на `filePath: "Ext/AdditionalIndexes.xml"` (по Catalog) |
| `synonym`, `comment`, `auxiliaryObjectForm`, `auxiliaryListForm`, `auxiliaryChoiceForm`, `defaultObjectForm`, `defaultListForm`, `defaultChoiceForm`, `objectPresentation`, `extendedObjectPresentation`, `listPresentation`, `extendedListPresentation`, `explanation` | добавить `defaultValueXMLRaw: ""` |
| `basedOn`, `registerRecords`, `characteristics`, `dataLockFields`, `inputByString` | добавить `defaultValueXMLRaw: {}` |

#### Константы и уровень правила

| Что | Сейчас | Целевое |
|---|---|---|
| `documentProperties` | `["Document", "Properties"]` | `["Properties"]` |
| `documentChildObjects` | `["Document", "ChildObjects"]` | `["ChildObjects"]` |
| `requiredXMLParents` | отсутствует | `[["ChildObjects"]]` |
| `childCollections` | отсутствует | `[{ propertyKey: "commands", itemRule: MetadataCommandRules }]` |

### Состав изменений в `types.ts`

- Сменить `numerator?: MetadataDocumentNumerator` на `numerator?: string` (ссылка на нумератор, не вложенный объект).
- Удалить связанный неиспользуемый импорт `MetadataDocumentNumerator{,XML,YAML}`.
- В `MetadataDocumentXML` — `Numerator?: string` (вместо `MetadataDocumentNumeratorXML`).
- В `MetadataDocumentYAML` — `Нумератор?: string` (вместо `MetadataDocumentNumeratorYAML`).
- Добавить `Numerator?: string` в `MetadataDocumentXML` (сейчас уже есть как `MetadataDocumentNumeratorXML` — заменить).

### Файловые артефакты

#### Создаются

- `packages/core/metadata/appliedObjects/metadataDocument/index.ts` — `export * from "./types"; export * from "./rules"`.
- `packages/core/metadata/appliedObjects/metadataDocument/fromXML.test.ts` — тест чтения `full.xml`.
- `packages/core/metadata/appliedObjects/metadataDocument/toXML.test.ts` — тест записи в XML на минимальной модели.
- `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts` — YAML→model.
- `packages/core/metadata/appliedObjects/metadataDocument/toYAML.test.ts` — model→YAML.
- `packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts` — конец-в-конец XML→YAML с записью на диск (по образцу `metadataSequence/`).
- `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts` — конец-в-конец YAML→XML (round-trip с побайтовым сравнением `full.xml`).

#### Удаляются

- `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.ts` — обёртка-артефакт. Соседи (Sequence/Numerator/Catalog) её не имеют.

#### Меняются (точечно)

- `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts:5,87` — переключить вызов с `importMetadataDocumentFromYAML(ctx, yaml, name)` на унифицированный `importMetadataItemFromYAML({ context: ctx, yaml, rule: MetadataDocumentRules, name })` (как уже сделано для Sequence/Catalog в этом файле — проверить и повторить паттерн).
- `packages/core/metadata/appliedObjects/index.ts` — добавить `import "./metadataDocument"`.

## Round-trip-стратегия

Целевой sanity-check — два теста:

1. **`fromXML.test.ts` + `toXML.test.ts`:** прочитать `__fixtures__/full.xml`, конвертировать в `MetadataDocument`, обратно в XML — побайтовое равенство.
2. **`convertFromXML.test.ts` + `syncToXML.test.ts`:** XML на диск (`__fixtures__/sync/ДокументВсеСвойства*`) → YAML-проект на диск → обратно XML на диск; диф пустой.

Если на каком-то шаге round-trip ломается — это либо упущенное свойство (добавить в `rules.ts`), либо упущенный `defaultValueXMLRaw` (расширить список), либо несоответствие между XSD-тегом и `xml:` (исправить).

## Риски

- **Несовместимое изменение API `MetadataDocument`.** Замена `numerator: MetadataDocumentNumerator` на `numerator: string` ломает любых внешних потребителей типа. На момент написания внешних потребителей в `packages/cli` и `packages/vscode-extension` нет (проверка в плане). Если найдутся — требуется отдельный шаг миграции; если не найдутся — правка локальная.
- **`defaults.ts` устарел.** Пометить в комментарии в `rules.ts` или в карточке follow-up. Расхождение с фикстурой не блокирует round-trip (правило `defaultValueXML` побеждает при сериализации).
- **Memory `project_forms_as_property_rule.md` устарела** — текущая целевая архитектура для форм Catalog/Document — это `ChildFormNames`/`ChildTemplateNames` (используется в `metadataCatalog/rules.ts`), а не отдельный PropertyRule по образцу `predefined`. Memory обновить отдельным шагом (вне границ этого PRD).

## Дополнения после детального дебага toXML (2026-04-26)

После запуска `metadataDocument/toXML.test.ts` на трёх фикстурах (`full.xml`, `minimal.xml`, `withNumerator.xml`) детальная классификация diff показала, что часть исходных «5 блокеров» из комментария-TODO в `toXML.test.ts` нужно уточнить, и обнаружен один новый.

### Уточнения существующих блокеров

**Блокер #1 (uuid mock) распадается на два независимых аспекта:**

- (1а) Корневой `<Document uuid="…">`. Прямой перенос приёма из `metadataCatalog/rules.ts` (`type: "string"` → `"uuid"` для `forReferenceOnly`-uuid поля) **не работает** для Document: атрибут на корне по-прежнему пустой, а внутри `<Document>` появляется лишний `<Document uuid="11111111-1111-4111-8111-111111111111"/>`. Источник корневого uuid отличается от Catalog'а — требует отдельного исследования (предположительно `presets/V8_MDCLASSES_ROOT` или общий `appliedObject` каркас).
- (1б) `<xr:TypeId>` внутри `TabularSection.InternalInfo` сериализуется как mock-UUID `11111111-…`, а должен быть реальным (либо мок=identity для round-trip, либо проброс reference UUID).

**Блокер #3 (InternalInfo на TabularSection) включает два дефекта:**

- (3а) Неверная категория: `CatalogTabularSection` вместо `DocumentTabularSection` в `<xr:GeneratedType name>`.
- (3б) Пустой parent name: `CatalogTabularSection..ТабличнаяЧасть` (две точки подряд) — отсутствует имя документа-родителя (`ДокументВсеСвойства`). Генератор `InternalInfo` не получает имя владельца при экспорте дочернего TabularSection.

**Блокер #5 (`<Use>ForItem</Use>`) распадается на два:**

- (5а) **Атрибуты документа.** Закрыто разделением правил по образцу `MetadataTabularSectionAttributeRules` ↔ `MetadataAttributeRules`: добавлен `MetadataDocumentAttributeRules` (без `use`/`binaryDataStorageLocationUse`, с сохранением `binaryDataStorageLocationUseField`). Зарегистрирована коллекция `MetadataDocumentAttributes`. `metadataDocument/rules.ts:attributes` переключён на новый тип. Проверочная фикстура — `metadataAttribute/__fixtures__/document.xml`.
- (5б) **`TabularSection.Properties`** документа — сохраняется. Решается тем же приёмом: разделение `MetadataTabularSectionRules` → `MetadataDocumentTabularSectionRules` без `use`.

### Новый блокер #6 — потеря trailing newline в `<v8:content>`

В `full.xml` поле `Explanation`:

```
- <v8:content>Пояснение\n</v8:content>
+ <v8:content>Пояснение</v8:content>
```

Экспортёр (`xmlExport`) обрезает завершающий перевод строки внутри текстового узла. На `minimal.xml`/`withNumerator.xml` поля нет, эффект только на `full.xml`. Природа — общий механизм `xmlExport`, не `rules.ts`.

### Текущий статус блокеров (после фикса 5а)

| # | Блокер | Статус |
|---|---|---|
| 1а | Корневой `<Document uuid>` | открыт, требует отдельного исследования |
| 1б | UUID в `TabularSection.InternalInfo` | открыт |
| 2 | Порядок `StandardAttributes` | открыт |
| 3а | InternalInfo: категория `Catalog`→`Document` | открыт |
| 3б | InternalInfo: пустой parent name | открыт |
| 4 | `<Form>` / `<Template>` сериализация (PRD-2) | открыт |
| 5а | `<Use>ForItem</Use>` у атрибутов | **закрыт** |
| 5б | `<Use>ForItem</Use>` у `TabularSection.Properties` | открыт (следующий) |
| 6 | Trailing newline в `<v8:content>` | открыт |

## Критерии готовности

1. Все шесть тестов (`fromXML`, `toXML`, `fromYAML`, `toYAML`, `convertFromXML`, `syncToXML`) для Document зелёные.
2. `pnpm test` из корня — зелёный.
3. `convertAppliedObjectFromXML(MetadataDocumentRules, full.xml)` → YAML → `syncAppliedObjectToXML` → побайтовое равенство `full.xml`.
4. Удалён `fromYAML.ts`; `importMetadataFileWithGraph.ts` использует унифицированный вызов.
5. Закомментированный block в `configuration/syncToXML.test.ts:84` (про пробелы Document) — убран, тест полноценно проходит для Document.
