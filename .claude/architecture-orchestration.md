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

## Граф связей метаданных

`buildGraphFromModel` (`orchestration/buildGraphFromModel.ts`) обходит модель параллельно с YAML AST и для каждого свойства смотрит зарегистрированные на его типе обработчики:

- `extractGraph` — одиночные reference-свойства (`MetadataField`, `MetadataItemLink`, `TypeDescription`); возвращает `GraphOps` с `references`.
- `buildGraphFromModel` — типы с кастомной логикой (`MetadataValue`, `FormAttributeColumns`, `DataPath`, `CommandName`, …); это **чистая функция** `BuildGraphFromModelFunction → GraphOps | GraphOps[] | undefined | void`. Обработчик не имеет доступа к графу, не делает побочных эффектов.
- `graphChild` — декларативное создание дочерних узлов из коллекций (`FormAttributes`, `FormCommands`, `FormParameters`).

`GraphOps`-секции имеют поля: `children` (owned-узлы с filePath), `references` (stub-узлы), `formLocalReferences` (рёбра, цель которых резолвится через `resolveFormLocalPath`), `recurse` (рекурсивные обходы подмодели по правилу), плюс `edgeKind`/`edgeYaml`. Для children и formLocalReferences опционально `parentOverride` — источник ребра ≠ ctx.parentNodeId. У references override намеренно не поддерживается (см. JSDoc типа).

Оркестратор нормализует возврат к массиву секций, для каждой непустой секции вызывает `applyGraphOps(section, ctx)` (единственный шлюз мутации `MetadataGraph`), затем разворачивает `recurse`-задачи через рекурсивный вызов `buildGraphFromModel`. Обработка `recurse` живёт **вне** проверки «непустой секции», чтобы секция с одним лишь `recurse` не отбрасывалась.

Параллельный обход `forms/elements/graphFromModel.ts::buildElementChildrenGraph` (свойства элементов формы) реализует тот же контракт, продолжая мутировать граф напрямую через `graph.promoteNode/ensureEdge` для коллекций и singletons — единственный legacy-обходчик после фазы 1b. В фазе 1c планируется его перевод на чистую форму и вынос общего хелпера `applyBuildGraphResult` для устранения дубликата normalize-блока с основным оркестратором.

### Что хранить в узлах, рёбрах и props

Графовая модель делит информацию по роли:

- **Узел** — самостоятельная предметная сущность, к которой есть смысл адресоваться по `id`, на которую могут ссылаться другие части модели, у которой есть собственный жизненный цикл файла или диагностический stub-режим.
- **Ребро** — факт отношения между двумя уже существующими сущностями. Ребро отвечает на вопрос «как источник связан с целью»: владение, ссылка, тип, значение, путь данных, зависимость для пересчёта.
- **Props узла** — скалярные характеристики самой сущности, которые не имеют собственного `id` и не являются навигационной связью.
- **Props ребра** — характеристики конкретной связи, без которых нельзя корректно различить несколько связей одного вида или восстановить исходное свойство.

Практическое правило: если по данным нужно писать Cypher вида «найти соседний объект», это ребро или узел. Если нужно только отфильтровать уже найденный объект по простому значению, это `props`.

#### Узлы

Создавай узел, когда значение:

- имеет стабильный `id` в формате полного YAML-пути;
- соответствует `MetadataItem` или подчинённому объекту с `itemType`;
- может быть целью ссылок из других файлов или объектов;
- должно переживать отсутствие владельца как stub-узел;
- имеет собственные дочерние узлы или owning-рёбра.

Примеры узлов: `MetadataCatalog`, `MetadataAttribute`, `FormAttribute`, `FormCommand`, `FormElement`, `ChoiceParameterLink`, `Type`.

Не создавай узел только ради хранения строки, флага, режима или результата разбора. Если «сущность» не нужна как адресуемая цель, сначала рассмотри props ребра или узла.

Stub-узел — это обычный узел без владельца-файла и без полного `item`: он имеет `id`/`name`, но не имеет `DECLARES` от `File`. Stub означает «ссылка уже есть, определение ещё не загружено или отсутствует».

#### Рёбра

Создавай ребро, когда значение:

- связывает две сущности и должно быть удобно для обхода в Cypher;
- выражает владение дочерним узлом (`owning: true`);
- выражает ссылку или зависимость (`owning: false`);
- нужно удалить вместе с файлом-источником при инкрементальном обновлении;
- должно нести координаты YAML или дополнительные атрибуты самой связи.

`kind` ребра — ASCII-тип отношения в FalkorDB (`TYPE`, `ATTRIBUTE`, `DATA_PATH`). `yaml` в props ребра — русское имя свойства или коллекции для round-trip и диагностики. Все виды рёбер регистрируются в `edgeKinds.ts`; неизвестный kind считается ошибкой.

Owning-рёбра (`owning: true`) выражают состав: владелец создаёт дочерний узел и управляет его жизненным циклом. Reference-рёбра (`owning: false`) выражают навигационную ссылку: цель может быть полной сущностью или stub-узлом.

Примеры:

- `(:MetadataCatalog)-[:ATTRIBUTE]->(:MetadataAttribute)` — owning, потому что реквизит является частью справочника.
- `(:MetadataAttribute)-[:TYPE]->(:Type)` — reference, потому что тип является отдельной целью ссылки.
- `(:FormElement)-[:DATA_PATH {property, sourcePath}]->(:MetadataAttribute)` — reference, потому что путь данных связывает владельца свойства с разрешённой целью.

Если одно JS-свойство может создать несколько целей, делай несколько рёбер с одинаковыми атрибутами свойства. Не вводи промежуточный узел только для группировки, пока эту группировку не нужно запрашивать как самостоятельную сущность.

#### Props узла

В props узла попадают скаляры и массивы скаляров из `node.item`. `walkGraphToFileData` добавляет `name`, а `flattenItem` кладёт поля модели под префиксом `p_`.

В props узла должны оставаться:

- простые свойства сущности: `p_synonym`, `p_comment`, `p_valueChange`;
- типовые настройки, которые не являются ссылками;
- денормализованные поля, нужные для фильтрации уже выбранного узла.

В props узла не должны попадать:

- `itemType` и `_uuid` — они отбрасываются всегда;
- вложенные коллекции объектов — для них нужны дочерние узлы или явное решение не графить;
- свойства, для которых `buildGraphFromModel` или `graphChild` уже создаёт графовые операции. Оркестратор добавляет такие ключи в `flattenSkipKeys`, чтобы не было дубля `p_*`.

Пример: `ChoiceParameterLink.valueChange` остаётся `p_valueChange`, потому что это характеристика самой связи параметров выбора. `ChoiceParameterLink.dataPath` после перехода к общей модели не должен оставаться `p_dataPath`, потому что он становится `DATA_PATH`-ребром с `sourcePath`.

#### Props ребра

В props ребра хранятся только примитивы. Базовое поле — `yaml`; `positionFrom*` добавляется из YAML AST для диагностики. Дополнительные поля допустимы, если они описывают именно связь, а не источник или цель.

Храни на ребре:

- `index` — порядок элемента в коллекции, когда он нужен для стабильного восстановления;
- `property` — имя JS-свойства, если один owner может иметь несколько связей одного `kind`;
- `sourcePath` — исходную строку ссылочного свойства, если цель может быть неоднозначной, stub или восстановление модели не должно зависеть от успешного разрешения;
- `pathMode` — режим разбора пути или другая характеристика связи. Не используй имя `kind` для props ребра: `EdgeData.kind` уже занят типом отношения, а `walkGraphToFileData` отбрасывает атрибут `kind` из props.

Не храни на ребре большие структуры, массивы объектов или данные, которые должны быть целью отдельного обхода. Если Cypher должен идти «внутрь» значения, значение должно стать узлом или набором рёбер.

### Как выбирать форму для нового свойства

Используй такую последовательность решений:

1. Если свойство описывает дочерний metadataItem с собственным `itemType` — это `graphChild` или `GraphOps.children` плюс owning-ребро.
2. Если свойство содержит ссылку на уже существующий объект — это `references` или `formLocalReferences` плюс reference-ребро.
3. Если свойство содержит сложную модель со своими внутренними ссылками, но само не должно становиться узлом — это `buildGraphFromModel` с `recurse` по синтетическому item-rule или специализированные `GraphOps`.
4. Если свойство нужно только для фильтрации владельца и не участвует в навигации — оставить в props узла.
5. Если свойство уточняет связь между owner и target — положить его в props ребра.

Выбирай узел только тогда, когда появляется самостоятельная адресуемая сущность. Выбирай ребро, когда главное знание — «A связано с B». Выбирай props, когда знание не создаёт новой навигации.

### DataPath как пример границы

`DataPath` не должен создавать отдельный узел только ради хранения исходной строки. Предметный факт — владелец свойства связан с конечной целью пути:

```text
(owner)-[:DATA_PATH { property, yaml, sourcePath, pathMode }]->(target)
```

`property` различает `dataPath`, `footerDataPath`, `rowPictureDataPath` и похожие свойства. `sourcePath` нужен для восстановления модели и диагностики stub-целей. Ограничения допустимой цели описываются в `rules.ts` через Cypher-контракт, а не кодируются отдельным типом узла.

Не вводи отдельные kind под имя свойства (`FOOTER_DATA_PATH`, `TITLE_DATA_PATH`, `ROW_PICTURE_DATA_PATH`). Имя свойства всегда хранится в `property` на `DATA_PATH`. Синтетические поля вроде `dataPathReference` не используются: если свойство представлено ребром, оно не должно дублироваться как `p_<property>` на узле.

Техническая память для инкрементального пересчёта выражается отдельными reference-рёбрами:

```text
(owner)-[:DATA_PATH_DEPENDS_ON { property, sourcePath }]->(dependency)
```

Так граф остаётся навигационным: Cypher из `rules.ts` может идти напрямую от владельца к цели, а watcher может найти владельцев путей, зависящих от изменённого узла.

### Владение графовыми узлами файлами

Графовые узлы не хранят `filePath` в props. Владение задаётся в `FileGraphData.declaredNodeIds` и в FalkorDB хранится как `(:File)-[:DECLARES]->(node)`. Влияющий файл, который не владеет жизненным циклом узла, задаётся через `contributedNodeIds` и хранится как `(:File)-[:CONTRIBUTES]->(node)`.

Для форм `Форма.yaml` является обязательным владельцем корня `ClientApplicationForm` и YAML-частей формы. `Форма.nkdk` владеет визуальными элементами формы и contributes в корневой узел формы.
