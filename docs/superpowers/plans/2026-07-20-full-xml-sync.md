# Full XML Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Заменить полную YAML → XML синхронизацию с XML-reference на двухпроходную синхронизацию через файл индекса конфигурации, которая формирует полный XML-проект и атомарно обновляет индекс только после успеха.

**Architecture:** Главный процесс проверяет входы, строит декларативный план файлов, один раз загружает индекс в общую память и управляет двумя проходами долгоживущих worker. Worker читают и хранят только назначенные YAML, во втором проходе непосредственно записывают XML и возвращают компактные фрагменты нового индекса; внешние файлы и `ConfigDumpInfo.xml` обрабатывает главный процесс.

**Tech Stack:** TypeScript 6, Node.js 26, Piscina, SharedArrayBuffer/TypedArray, Vitest, fast-xml-parser, @node-rs/xxhash, p-limit.

## Global Constraints

- Источник требований: `docs/superpowers/specs/2026-07-20-full-xml-sync-design.md`, `.agents/architecture.md`, `.agents/configuration-index-format/v1_0.md`, `.agents/restrictions.md`.
- Формат файла индекса 1.0 не изменять.
- `packages/core/metadata/orchestration`, `packages/core/metadata/project` и общий worker-код не должны содержать условий по конкретным `itemType`, каталогам `Формы`/`Макеты` или XML-корням.
- Не добавлять частные fromXML/toXML/fromYAML/toYAML-правила; новое поведение проводить через общий контекст индекса, существующие `rules.ts` и нейтральные регистрации маршрутов/писателей.
- Существующие XML-фикстуры не изменять.
- Не выполнять полную validation внутри sync: разрешены только ошибки чтения, синтаксиса YAML, построения модели, XML и договоров операции.
- Второй проход не читает YAML другого задания и не получает полные данные YAML из главного процесса.
- XML-результат, новые идентификаторы и новый индекс должны быть одинаковыми при одном и четырёх worker.
- Каждый тест должен укладываться в 5 секунд; профиль ERP не включать в обычный набор тестов.
- После каждого задания запускать указанные узкие тесты. Перед завершением обязательно выполнить `pnpm type-check` и `pnpm test` из корня.

---

## File Map

### Новые модули

- `packages/core/metadata/configurationIndex/sharedSnapshot.ts` — неизменяемый снимок бинарного индекса в общей памяти и ленивый reader по `logicalAddress`.
- `packages/core/metadata/configurationIndex/exportRuntime.ts` — контекст чтения исходного индекса, сбор нового фрагмента и детерминированная генерация значений.
- `packages/core/metadata/configurationIndex/referenceView.ts` — rule-guided представление сохранённых `XML_NODES`, `XML_VALUES` и `IDENTITIES` для существующего toXML-конвейера.
- `packages/core/metadata/fullSyncToXml/types.ts` — договоры задания, команд worker, диагностик, файлов и результата операции.
- `packages/core/metadata/fullSyncToXml/discovery.ts` — построение заданий и списка внешних файлов по правилам.
- `packages/core/metadata/fullSyncToXml/sharedMetadata.ts` — общий снимок владельцев `ПутьКДанным` и состава Проекта.
- `packages/core/metadata/fullSyncToXml/worker.ts` — долгоживущий worker двух проходов.
- `packages/core/metadata/fullSyncToXml/workerPool.ts` — статическое распределение и конечный автомат worker-пула.
- `packages/core/metadata/fullSyncToXml/writeAssignment.ts` — построение XML одного задания без чтения соседних YAML.
- `packages/core/metadata/fullSyncToXml/transferExternalFiles.ts` — ограниченное параллельное копирование внешних файлов с хэшированием тех же байтов.
- `packages/core/metadata/fullSyncToXml/writeConfigDumpInfo.ts` — построение общего `ConfigDumpInfo.xml` из результатов worker.
- `packages/core/metadata/fullSyncToXml/syncConfiguration.ts` — координатор полной синхронизации и атомарная фиксация индекса.
- `packages/core/metadata/fullSyncToXml/index.ts` — публичные экспорты модуля.

### Основные изменяемые модули

- `packages/core/metadata/context/types.ts`, `packages/core/metadata/helpers/uuid.ts` — контекст индекса при export и генерация UUID.
- `packages/core/metadata/orchestration/property/toXML.ts`, `packages/core/metadata/orchestration/metadataItem/toXML.ts`, `packages/core/metadata/orchestration/metadataCollection/toXML.ts` — общее восстановление данных XML из индекса.
- `packages/core/metadata/forms/**/toXML.ts` — только симметричное продвижение общих logicalAddress там, где fromXML уже делает это явно.
- `packages/core/metadata/project/resources.ts`, `packages/core/metadata/project/ruleResources.ts`, `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts` — полная декларативная карта YAML/внешних файлов в XML.
- `packages/core/metadata/project/preparedYamlProjectWorker.ts` и новый `packages/core/metadata/project/prepareYamlFiles.ts` — переиспользуемое чтение/разбор YAML без дублирования алгоритма validation.
- `packages/core/metadata/appliedObjects/configuration/rootIO.ts`, `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`, `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` — чистые точки записи одного заранее подготовленного задания.
- `packages/core/index.ts`, CLI и MCP — новый публичный договор без `referenceDir` и без выбора старой инкрементальной реализации.

---

### Task 1: Добавить неизменяемый снимок файла индекса в общей памяти

**Files:**

- Create: `packages/core/metadata/configurationIndex/sharedSnapshot.ts`
- Create: `packages/core/metadata/configurationIndex/sharedSnapshot.test.ts`
- Modify: `packages/core/metadata/configurationIndex/fileIO.ts`
- Modify: `packages/core/metadata/configurationIndex/index.ts`

**Step 1: Write the failing tests**

Покрыть:

- чтение и полную проверку encoded-индекса до создания снимка;
- один `SharedArrayBuffer` для нескольких reader;
- поиск `binding`, `projectFile`, `identity`, `xmlNode`, `xmlValue` по ключу без `decodeConfigurationIndex` в worker;
- ленивое декодирование строк с небольшим локальным кэшем;
- отсутствие результата для неизвестного `logicalAddress`;
- отклонение повреждённого индекса до запуска worker.

Зафиксировать договор:

```ts
export interface SharedConfigurationIndexSnapshot {
  readonly bytes: SharedArrayBuffer
  readonly byteLength: number
  readonly stringOffsets: SharedArrayBuffer
  readonly orderOffsets: SharedArrayBuffer
  readonly xmlNodeOffsets: SharedArrayBuffer
}

export interface ConfigurationIndexReader {
  binding(): ConfigurationIndexBinding
  projectFile(projectPath: string): ConfigurationProjectFile | undefined
  identity(logicalAddress: string, kind: ConfigurationIdentity["kind"]): string | undefined
  xmlNode(logicalAddress: string): ConfigurationXmlNode | undefined
  xmlValue(logicalAddress: string): ConfigurationXmlValue | undefined
}
```

**Step 2: Run the focused test and confirm RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/sharedSnapshot.test.ts
```

Expected: FAIL because `sharedSnapshot.ts` and its exports do not exist.

**Step 3: Implement the minimal shared reader**

- Читать исходные байты один раз через новый `readConfigurationIndexSnapshot({ projectDir, baseId })`.
- В главном процессе вызвать существующий `decodeConfigurationIndex` только для полной проверки и извлечения `binding`.
- Скопировать проверенные encoded-байты в `SharedArrayBuffer`.
- Один раз построить общие таблицы смещений для переменных секций `STRINGS`, `XML_ORDERS`, `XML_NODES`.
- В reader использовать двоичный поиск по UTF-8/stringId и отсортированным секциям; полные массивы индекса не материализовывать.
- Возвращать отдельную копию небольших найденных записей, не изменяющую общий буфер.

**Step 4: Run tests and type-check**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/sharedSnapshot.test.ts metadata/configurationIndex/decode.test.ts metadata/configurationIndex/fileIO.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/configurationIndex
git commit -m "feat: :sparkles: добавить общий снимок индекса"
```

---

### Task 2: Добавить двунаправленный export-контекст индекса и детерминированную генерацию

**Files:**

- Create: `packages/core/metadata/configurationIndex/exportRuntime.ts`
- Create: `packages/core/metadata/configurationIndex/exportRuntime.test.ts`
- Create: `packages/core/metadata/helpers/uuid.test.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/helpers/uuid.ts`
- Modify: `packages/core/metadata/configurationIndex/index.ts`

**Step 1: Write the failing tests**

Проверить:

- существующий UUID берётся из исходного индекса и попадает в новый collector;
- отсутствующий UUID детерминированно создаётся из seed, `logicalAddress` и вида значения;
- одинаковые входы дают одинаковые UUID/`xmlId`/40-символьные `configVersion` независимо от порядка вызовов;
- разные адреса и виды дают разные значения;
- конфликт повторно записанного значения остаётся ошибкой collector;
- обычный вызов `getUUID(context)` вне sync сохраняет прежнее поведение и `testMode`.

Договор runtime:

```ts
export interface ConfigurationIndexExportRuntime {
  readonly source: ConfigurationIndexReader
  readonly collector: ConfigurationIndexCollector
  readonly targetProjectPath: string
  readonly logicalAddress: string
  identity(kind: ConfigurationIdentity["kind"], address?: string): string | undefined
  identityOrCreate(kind: "uuid" | "xmlId", address?: string): string
  xmlNode(address?: string): ConfigurationXmlNode | undefined
  xmlValue(address?: string): ConfigurationXmlValue | undefined
  configVersion(address: string): string
}
```

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/exportRuntime.test.ts metadata/helpers/uuid.test.ts
```

Expected: FAIL on missing runtime API.

**Step 3: Implement deterministic generation**

- Seed операции вычислять SHA-256 от encoded-байтов исходного индекса и `targetGeneration` в little-endian.
- Производное значение вычислять SHA-256 от seed, нулевого разделителя, вида значения и UTF-8 `logicalAddress`.
- UUID формировать из первых 16 байт с RFC 4122 variant и стабильным version nibble.
- `configVersion` формировать из первых 20 байт как 40 lowercase hex.
- Кэшировать значение по паре `kind + logicalAddress` внутри runtime.
- `getUUID` должен делегировать runtime только при наличии export-контекста индекса.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/exportRuntime.test.ts metadata/helpers/uuid.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/configurationIndex packages/core/metadata/context/types.ts packages/core/metadata/helpers/uuid.ts
git commit -m "feat: :sparkles: добавить контекст генерации XML"
```

---

### Task 3: Восстанавливать общие данные XML из индекса без reference-модели

**Files:**

- Create: `packages/core/metadata/configurationIndex/referenceView.ts`
- Create: `packages/core/metadata/configurationIndex/referenceView.test.ts`
- Create: `packages/core/metadata/orchestration/property/toXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/toXML.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/toXML.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/toXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`

**Step 1: Write round-trip-oriented failing tests**

Из одного небольшого XML-объекта выполнить fromXML с collector, затем YAML/model → XML только через reader исходного фрагмента. Проверить восстановление:

- порядка свойств `XML_ORDERS`;
- XML-alias из `XML_NODES.aliases`;
- значимого присутствия свойства из `XML_NODES.present`;
- UUID, `_id` и невосстановимого `_name` из `IDENTITIES`;
- `xsi:nil`, `xmlPrefix` и `userSettingsId` из `XML_VALUES`;
- удаления записи из нового фрагмента, если соответствующего элемента больше нет в текущей модели.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/referenceView.test.ts
```

Expected: FAIL because toXML still requires `referenceMetadata`.

**Step 3: Implement the generic reference view**

- Продвигать logicalAddress через export свойств и metadata-коллекций симметрично существующему fromXML-контексту.
- `getOrderedKeysToXML` сначала использует `runtime.xmlNode().order`, затем текущий fallback.
- `setXMLValue` использует сохранённый alias и `present`, не требуя `XML_SOURCE_KEYS` целой reference-модели.
- Значения из `XML_VALUES` восстанавливать через нейтральный descriptor регистрации типа; расширить существующий `ConfigurationIndexValueFromXMLDescriptor` симметричным export-поведением, не добавляя частных условий в общий слой.
- Каждое успешно использованное значение сразу записывать в collector текущего задания.
- Legacy `referenceMetadata` оставить только для short round-trip и старого внутреннего incremental-кода; новая sync не передаёт его.

**Step 4: Run related regression tests**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/referenceView.test.ts metadata/orchestration/property/toXML.test.ts metadata/orchestration/metadataItem/toXML.test.ts metadata/orchestration/metadataCollection/ruleFactory.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/configurationIndex packages/core/metadata/orchestration
git commit -m "feat: :sparkles: восстанавливать XML из индекса"
```

---

### Task 4: Продвинуть logicalAddress через формы и специальные вложенные коллекции

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/toXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootXML.test.ts`

**Step 1: Write failing symmetry tests**

Для каждого места, где соответствующий fromXML уже вызывает `withConfigurationIndexLogicalAddress`, проверить toXML только с runtime:

- форма и её `UserSettingsID`;
- именованные элементы формы и их `_id`;
- реквизиты, колонки и команды формы;
- корень `Конфигурация` и его UUID;
- отсутствие индексной адресации не меняет существующий результат.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/commonObjects/childItems/toXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts metadata/appliedObjects/configuration/rootXML.test.ts
```

Expected: новые проверки не находят вложенные значения индекса.

**Step 3: Implement symmetric context propagation**

- Использовать общие builders `childUid`, `indexedUid`, `yamlKeyUid`, `yamlIndexUid` через export-context helpers.
- Не дублировать строки адресов в формах; вынести симметричные операции рядом с `configurationIndex/collector/context.ts` либо в `exportRuntime.ts`.
- В местах создания ID сначала спрашивать runtime, затем детерминированный генератор.
- Фактически использованные записи фиксировать collector текущего задания.

**Step 4: Run GREEN and focused round-trips**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/commonObjects/childItems/toXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts metadata/forms/commonObjects/formCommand/toXML.test.ts metadata/appliedObjects/configuration/rootXML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/forms packages/core/metadata/appliedObjects/configuration/rootIO.ts packages/core/metadata/appliedObjects/configuration/rootXML.test.ts
git commit -m "feat: :sparkles: восстановить идентификаторы вложенных элементов"
```

---

### Task 5: Сделать правила маршрутов полными и проверяемыми

**Files:**

- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/project/ruleResources.ts`
- Modify: `packages/core/metadata/project/ruleResources.test.ts`
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/resources.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
- Create: `packages/core/metadata/fullSyncToXml/routeCoverage.test.ts`
- Modify only where the coverage test reports missing declarations: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`, `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`, `packages/core/metadata/commonObjects/module/toXML.ts`, `packages/core/metadata/commonObjects/help/toXML.ts`, `packages/core/metadata/commonObjects/externalFile/toXML.ts`, `packages/core/metadata/commonObjects/externalPicture/toXML.ts`, `packages/core/metadata/commonObjects/wsDefinitionSchemas/toXML.ts`, `packages/core/metadata/commonObjects/recalculation/register.ts`, `packages/core/metadata/commonObjects/childSubsystemNames/toXML.ts`.

**Step 1: Write a failing registry audit**

Для всех зарегистрированных project resources проверить, что полная sync может определить одно из действий:

- YAML обрабатывается worker и имеет один или несколько объявленных XML-выходов;
- файл переносится главным процессом по объявленному XML-пути;
- каталог переносится по префиксному маршруту с `relativePath`;
- ресурс явно не участвует в XML-результате.

Отдельно проверить маршруты формы: `Форма.yaml`, `Модуль.bsl`, HTML-справка и создаваемый `Help.xml`; маршруты макета: `Template.xml`, `Template.txt`, `Template.bin` и вложенное содержимое.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/routeCoverage.test.ts metadata/project/resources.test.ts metadata/project/ruleResources.test.ts
```

Expected: FAIL with a deterministic list of uncovered resource descriptors.

**Step 3: Extend neutral route contracts**

- Добавить общий route kind для префиксного каталога и для XML-файла, производного от списка внешних файлов.
- Научить discovery классифицировать потомков `ProjectResourceDescriptor.kind === "directory"` без знания имени каталога.
- Зарегистрировать недостающие маршруты рядом с соответствующими property types.
- Не переносить `referenceDir`, `referenceName` и legacy preserve-reference flags в новый договор.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/routeCoverage.test.ts metadata/project/resources.test.ts metadata/project/ruleResources.test.ts metadata/orchestration/appliedObject/xmlAreas.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS; audit reports zero uncovered resources.

**Step 5: Commit**

```bash
git add packages/core/metadata/project packages/core/metadata/orchestration packages/core/metadata/commonObjects packages/core/metadata/fullSyncToXml/routeCoverage.test.ts
git commit -m "feat: :sparkles: описать полные маршруты XML-синхронизации"
```

---

### Task 6: Построить задания и план внешних файлов до чтения YAML

**Files:**

- Create: `packages/core/metadata/fullSyncToXml/types.ts`
- Create: `packages/core/metadata/fullSyncToXml/discovery.ts`
- Create: `packages/core/metadata/fullSyncToXml/discovery.test.ts`

**Step 1: Write failing planner tests**

Зафиксировать договоры:

```ts
export interface FullXmlSyncAssignment {
  id: string
  sourceProjectPath: string
  sourcePath: string
  role: "configuration" | "properties" | "form"
  itemType: string
  itemName: string
  logicalAddress: string
  owner?: { itemType: string; name: string; logicalAddress: string }
  outputs: readonly FullXmlSyncOutput[]
}

export interface FullXmlSyncExternalFile {
  sourceProjectPath: string
  sourcePath: string
  targetXmlPath: string
}
```

Проверить:

- одно задание на один исходный YAML;
- все XML-выходы одного YAML находятся в этом задании;
- `Конфигурация.yaml` создаёт `Configuration.xml`;
- внешние файлы не назначаются worker;
- пути нормализованы относительно корней и не выходят наружу;
- конфликт двух заданий, внешних файлов или общего файла по target XML path отклоняется до worker;
- итоговый порядок стабилен по UTF-8 и не зависит от порядка `readdir`.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/discovery.test.ts
```

Expected: FAIL on missing planner.

**Step 3: Implement discovery**

- Переиспользовать `discoverMetadataProjectResources` и декларативные routes.
- В assignment передавать только сериализуемые идентификаторы правил/маршрутов, не функции и не полные rules-объекты.
- Зарезервировать `ConfigDumpInfo.xml` за главным процессом при проверке конфликтов.
- Не вычислять хэши и не читать содержимое файлов.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/discovery.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/fullSyncToXml
git commit -m "feat: :sparkles: построить план полной синхронизации"
```

---

### Task 7: Выделить переиспользуемый первый проход чтения YAML

**Files:**

- Create: `packages/core/metadata/project/prepareYamlFiles.ts`
- Create: `packages/core/metadata/project/prepareYamlFiles.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Create: `packages/core/metadata/fullSyncToXml/sharedMetadata.ts`
- Create: `packages/core/metadata/fullSyncToXml/sharedMetadata.test.ts`

**Step 1: Write failing tests**

Проверить, что общая функция:

- читает `Buffer` один раз, вычисляет `hashFileBytes(buffer)` и разбирает этот же buffer как UTF-8;
- возвращает разобранные данные только вызывающему worker-коду;
- извлекает только owner/composition facts без запуска schema validation и проверки ссылок;
- агрегирует синтаксические и I/O-ошибки, продолжая остальные файлы;
- создаёт shared metadata snapshot с owners и составом объектов;
- несколько reader общего metadata snapshot используют один `SharedArrayBuffer`.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/prepareYamlFiles.test.ts metadata/fullSyncToXml/sharedMetadata.test.ts
```

Expected: FAIL because preparation is embedded in validation worker.

**Step 3: Extract and reuse preparation**

- Вынести чтение, `parseMetadataYamlData`, declarations/dependencies и измерения из `preparedYamlProjectWorker.ts` в нейтральную функцию.
- Экспортировать из `yamlFactExtractor.ts` узкую функцию owner facts без validation diagnostics.
- Состав Проекта строить из descriptors задания, а не из полных моделей.
- Собрать `FullXmlSyncSharedMetadata` из существующего shared owner snapshot и нового компактного composition snapshot.
- Сохранить прежнее поведение validation и import без дополнительных чтений.

**Step 4: Run GREEN and validation regressions**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/prepareYamlFiles.test.ts metadata/project/preparedYamlProject.test.ts metadata/fullSyncToXml/sharedMetadata.test.ts metadata/validation/yamlFactExtractor.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/project packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/fullSyncToXml/sharedMetadata.ts packages/core/metadata/fullSyncToXml/sharedMetadata.test.ts
git commit -m "refactor: :recycle: выделить подготовку YAML-файлов"
```

---

### Task 8: Реализовать первый проход и конечный автомат worker-пула

**Files:**

- Create: `packages/core/metadata/fullSyncToXml/worker.ts`
- Create: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Create: `packages/core/metadata/fullSyncToXml/workerPool.ts`
- Create: `packages/core/metadata/fullSyncToXml/workerPool.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`

**Step 1: Write failing worker-boundary tests**

Команды:

```ts
type FullXmlSyncWorkerCommand =
  | { kind: "initialize"; workerIndex: number; context: SerializableSyncContext; outputDir: string }
  | { kind: "firstPass"; assignments: FullXmlSyncAssignment[] }
  | { kind: "secondPass"; sharedMetadata: FullXmlSyncSharedMetadata; index: SharedConfigurationIndexSnapshot; generationSeed: Uint8Array }
  | { kind: "dispose" }
```

Проверить:

- static round-robin и ровно один долгоживущий thread на активный worker;
- один assignment всегда остаётся в том же worker между проходами;
- первый проход возвращает только диагностики, хэши и компактные facts, без YAML data;
- ошибка одного задания не мешает обработать остальные задания worker;
- при любой ошибке первого прохода `runSecondPass` запрещён;
- crash уничтожает весь пул без перезапуска;
- `concurrency = 1` всё равно использует worker thread, а не выполняет handler в главном процессе.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts
```

Expected: FAIL on missing worker pool.

**Step 3: Implement first-pass state**

- Хранить `Map<assignmentId, PreparedYamlData>` только в module state worker.
- Нормализовать concurrency как import: `max(1, min(4, availableParallelism() - 1))`.
- Передавать `ArrayBuffer` только там, где нужен transfer; owner facts пока остаются компактными structured-clone данными.
- Добавить явные фазы `new → initialized → firstPassRunning → firstPassReady/firstPassErrors → secondPassRunning → secondPassDone → closed/crashed`.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/fullSyncToXml
git commit -m "feat: :sparkles: добавить worker-пул полной синхронизации"
```

---

### Task 9: Записывать одно подготовленное объектное задание без соседних YAML

**Files:**

- Create: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Create: `packages/core/metadata/fullSyncToXml/writeAssignment.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Create: `packages/core/metadata/orchestration/appliedObject/syncPreparedToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`

**Step 1: Write failing tests for a properties assignment**

Проверить:

- writer получает уже разобранный YAML и не вызывает `fs.readFile` для YAML;
- rules lookup идёт по сериализуемому `itemType` задания;
- owner model строится через существующий `importMetadataItemFromYAML`;
- формы/макеты владельца берутся из shared composition, а не через `readdir`;
- writer создаёт только объявленные output paths и возвращает фактически записанные пути;
- writer использует index runtime и возвращает `ConfigurationIndexFragment` с `targetProjectPath` задания;
- ошибка одного output не оставляет ложную запись в returned files/fragment.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/writeAssignment.test.ts metadata/orchestration/appliedObject/syncPreparedToXML.test.ts
```

Expected: FAIL because current sync reads directories, sibling YAML and reference XML.

**Step 3: Extract a prepared assignment writer**

- Оставить legacy `syncAppliedObjectToXML` для старых внутренних тестов/incremental-кода.
- Выделить чистую функцию, принимающую `preparedYamlData`, rule, outputs, owner cache, composition и index runtime.
- Не вызывать `addFileItemChildCollectionsFromYAML`, `collectFileChildNames`, `readReferenceModel` или `syncExternalToXML` с обходом каталогов.
- Для выходов, описанных `xmlSyncWriter`, вызывать только новый prepared-writer contract.
- После сериализации фиксировать реально использованные данные в collector; не разбирать написанный XML повторно.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/writeAssignment.test.ts metadata/orchestration/appliedObject/syncPreparedToXML.test.ts metadata/orchestration/appliedObject/syncToXML.partial.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/orchestration
git commit -m "feat: :sparkles: записывать подготовленное XML-задание"
```

---

### Task 10: Поддержать задания форм и корневой Конфигурации

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
- Create: `packages/core/metadata/fullSyncToXml/writeRootAssignment.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`

**Step 1: Write failing tests**

Проверить:

- `Форма.yaml` строит XML из переданных parsed data и index runtime, не читая файл повторно;
- модуль и HTML-справка формы не копируются worker;
- `Конфигурация.yaml` формирует `Configuration.xml`;
- `ChildObjects` корня строится из полного shared composition и одинаков при 1/4 worker;
- отсутствующий объект не попадает в `Configuration.xml`;
- каждый общий output принадлежит ровно одному заданию.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/syncToXML.test.ts metadata/fullSyncToXml/writeRootAssignment.test.ts
```

Expected: FAIL because existing writers read project directories/reference.

**Step 3: Add prepared form/root entry points**

- Добавить `writePreparedFormToXML` с prepared YAML data и общими индексами.
- Оставить старый disk-based wrapper только для совместимости старого внутреннего пути.
- Добавить `writePreparedConfigurationToXML`, принимающий composition reader вместо обхода Проекта/XML.
- Возвращать сведения для `ConfigDumpInfo` отдельно от самого Map контекста.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/syncToXML.test.ts metadata/fullSyncToXml/writeRootAssignment.test.ts metadata/appliedObjects/configuration/rootXML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/forms packages/core/metadata/commonObjects/childFormNames packages/core/metadata/appliedObjects/configuration/rootIO.ts packages/core/metadata/fullSyncToXml
git commit -m "feat: :sparkles: записывать формы и корень из worker данных"
```

---

### Task 11: Завершить второй проход worker и передачу фрагментов индекса

**Files:**

- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/configurationIndex/fragment.ts`
- Modify: `packages/core/metadata/configurationIndex/fragment.test.ts`

**Step 1: Write failing second-pass tests**

Проверить:

- worker получает только descriptors shared snapshots, не полные decoded indexes;
- последовательно обрабатывает свои assignment и продолжает после обычной ошибки одного из них;
- освобождает prepared YAML/model завершённого задания;
- возвращает diagnostics, warnings, written paths, ConfigDumpInfo facts и один `ArrayBuffer` фрагментов;
- transfer list содержит ровно buffer фрагментов;
- главный процесс обнаруживает повторные target paths и logicalAddress;
- при ошибках второго прохода pool возвращает все диагностики, но итог считается неуспешным.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts metadata/configurationIndex/fragment.test.ts
```

Expected: FAIL because second pass is not implemented.

**Step 3: Implement second pass**

- Создавать один reader исходного индекса на worker и маленький cache.
- Для каждого задания создавать отдельный collector/runtime, затем добавлять завершённый fragment.
- Кодировать все фрагменты worker существующим компактным форматом с local string pool.
- Перед возвратом освобождать Map prepared data; `dispose` очищает остаток после ошибок.
- Не перечитывать записанный XML.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts metadata/configurationIndex/fragment.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/configurationIndex/fragment.ts packages/core/metadata/configurationIndex/fragment.test.ts
git commit -m "feat: :sparkles: завершить второй проход синхронизации"
```

---

### Task 12: Копировать внешние файлы и хэшировать записанные байты

**Files:**

- Create: `packages/core/metadata/fullSyncToXml/transferExternalFiles.ts`
- Create: `packages/core/metadata/fullSyncToXml/transferExternalFiles.test.ts`

**Step 1: Write failing tests**

Проверить:

- ограниченный параллелизм;
- создание родительских каталогов и прямая запись без отдельного temporary-файла/fsync на каждый внешний файл;
- `contentHash` вычислен по тому же Buffer, который передан `writeFile`;
- результат содержит project path исходного файла, а не XML path;
- конфликт/выход за target root отклонён до записи;
- ошибка одного файла завершает этап, уже скопированные файлы не удаляются.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/transferExternalFiles.test.ts
```

Expected: FAIL on missing transfer module.

**Step 3: Implement transfer**

- Использовать `p-limit`, по умолчанию существующее быстрое значение I/O concurrency.
- Один раз читать source Buffer, по нему считать XXH3-64 и этот же Buffer писать в target.
- Сортировать returned hashes по UTF-8 project path.
- Не использовать rename: исходные файлы Проекта должны сохраниться.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/transferExternalFiles.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/fullSyncToXml/transferExternalFiles.ts packages/core/metadata/fullSyncToXml/transferExternalFiles.test.ts
git commit -m "feat: :sparkles: переносить внешние файлы полной синхронизации"
```

---

### Task 13: Формировать `ConfigDumpInfo.xml` в главном процессе

**Files:**

- Create: `packages/core/metadata/fullSyncToXml/writeConfigDumpInfo.ts`
- Create: `packages/core/metadata/fullSyncToXml/writeConfigDumpInfo.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/build.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts`

**Step 1: Write failing tests**

Проверить:

- входом являются объединённые composition/worker facts, а не XML-reference и не повторный разбор XML;
- существующие UUID берутся из index runtime, новые генерируются детерминированно;
- `configVersion` генерируется детерминированно по имени записи;
- порядок entries/children стабилен;
- `ConfigDumpInfo.xml` пишется только после worker и external transfer;
- ошибка не изменяет индекс.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/writeConfigDumpInfo.test.ts metadata/appliedObjects/configDumpInfo/build.test.ts
```

Expected: FAIL because current builder starts from a parsed reference file and random generators.

**Step 3: Implement index-backed builder**

- Сохранить существующий `buildConfigDumpInfo` для legacy path, но передавать ему адаптер index-backed reference и deterministic generators.
- Не читать `ConfigDumpInfo.xml` из input/output каталогов.
- Зарегистрировать использованные/новые значения `ConfigDumpInfo.xml` в отдельном fragment с `targetProjectPath: "Конфигурация.yaml"`; этот путь задаёт владельца transient-фрагмента и не добавляет второй элемент в `PROJECT_FILES`.
- Писать XML напрямую в target root.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/writeConfigDumpInfo.test.ts metadata/appliedObjects/configDumpInfo/build.test.ts metadata/appliedObjects/configDumpInfo/toXML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/appliedObjects/configDumpInfo
git commit -m "feat: :sparkles: формировать общий ConfigDumpInfo"
```

---

### Task 14: Собрать координатор и атомарно фиксировать новый индекс последним

**Files:**

- Create: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Create: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Create: `packages/core/metadata/fullSyncToXml/index.ts`
- Modify: `packages/core/metadata/configurationIndex/fileIO.ts`
- Modify: `packages/core/metadata/configurationIndex/projectFiles.ts`

**Step 1: Write coordinator tests with injected dependencies**

Проверить точную последовательность:

1. входной Проект существует;
2. target отсутствует/пуст, непустой target не изменяется;
3. index существует, валиден и совместим;
4. discovery и shared snapshot;
5. первый проход;
6. shared metadata;
7. второй проход;
8. merge/check worker files and fragments;
9. external transfer;
10. `ConfigDumpInfo.xml`;
11. сбор нового `ConfigurationIndexData`;
12. atomic index write последним.

Отдельные тесты:

- target создаётся, если отсутствует;
- при ошибке первого прохода XML не записывается и индекс прежний;
- при ошибке второго прохода partial XML остаётся, transfer/ConfigDumpInfo/index не вызываются;
- при ошибке transfer или ConfigDumpInfo прежний index остаётся;
- `indexGeneration + 1`, текущий `producerVersion`, прежние `baseId/baseFingerprint/configurationVersion`;
- `PROJECT_FILES` содержит хэши всех текущих YAML и внешних файлов;
- старые записи удалённого объекта отсутствуют;
- успешный result содержит `succeeded`, `warnings`, `configurationIndexPath`.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/syncConfiguration.test.ts
```

Expected: FAIL on missing coordinator.

**Step 3: Implement coordinator**

- Ввести `FullXmlSyncCoordinatorDependencies` по аналогии с import coordinator для быстрых failure tests.
- Освобождать worker pool в `finally`.
- Не удалять и не очищать target при любой ошибке.
- Hash YAML брать из first-pass results; внешние hashes — из transfer; не запускать повторный общий hashing pass.
- `writeConfigurationIndexAtomically` вызывать ровно один раз и последним.

**Step 4: Run GREEN**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/syncConfiguration.test.ts metadata/fullSyncToXml/workerPool.test.ts metadata/configurationIndex/fileIO.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/configurationIndex
git commit -m "feat: :sparkles: собрать полную синхронизацию в XML"
```

---

### Task 15: Переключить Core, CLI и MCP на новый договор полной синхронизации

**Files:**

- Modify: `packages/core/index.ts`
- Modify: `packages/cli/src/commands/sync.ts`
- Modify: `packages/cli/src/commands/sync.test.ts`
- Modify: `packages/cli/src/cli.ts`
- Modify: `packages/cli/src/cli.test.ts`
- Modify: `packages/mcp/src/contracts/syncToXml.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `packages/mcp/src/services/syncToXml.test.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/src/prompts/index.ts`
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: `packages/mcp/README.md`

**Step 1: Write failing contract tests**

Новый публичный вход:

```ts
{
  yamlDir: string
  xmlDir: string
  baseId?: string       // пока реально поддерживается только default
  concurrency?: number
  allowWrite?: boolean
}
```

Проверить:

- `referenceDir` и `fullSync` отсутствуют в Zod/CLI/API;
- `sync_to_xml` означает полную синхронизацию и не выбирает legacy incremental по `.nkdk-sync.yaml`;
- `allowWrite !== true` выполняет только preflight/discovery и возвращает план без записи;
- write-вызов передаёт `baseId`/`concurrency` новому core API;
- result отображает warnings и `configurationIndexPath`;
- тексты prompt/guide требуют отсутствующий либо пустой XML-target и существующий индекс, не упоминают reference.

**Step 2: Run RED**

```bash
pnpm --filter @nkdk/cli exec vitest run src/commands/sync.test.ts src/cli.test.ts
pnpm --filter @nkdk/mcp exec vitest run src/services/syncToXml.test.ts src/tools/registerTools.test.ts
```

Expected: FAIL because public layers still select incremental/reference behavior.

**Step 3: Switch exports and adapters**

- Экспортировать новый coordinator как `syncConfigurationToXML` из `packages/core/index.ts`.
- Старый `syncConfigurationIncrementallyToXML` не вызывать из CLI/MCP; исходный модуль можно оставить внутренним до отдельной спецификации частичной синхронизации.
- `planSyncToXml` заменить на read-only preflight нового coordinator; он не строит YAML models и не создаёт target.
- В CLI заменить `--reference` на `--workers <count>` и передавать значение как `concurrency`.
- Обновить русские сообщения ошибок и документацию MCP.

**Step 4: Run GREEN and package type checks**

```bash
pnpm --filter @nkdk/cli exec vitest run src/commands/sync.test.ts src/cli.test.ts
pnpm --filter @nkdk/mcp exec vitest run src/services/syncToXml.test.ts src/tools/registerTools.test.ts src/prompts/index.test.ts src/guides/index.test.ts
pnpm --filter @nkdk/cli exec tsc --noEmit
pnpm --filter @nkdk/mcp type-check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/index.ts packages/cli packages/mcp
git commit -m "feat: :sparkles: переключить API на полную XML-синхронизацию"
```

---

### Task 16: Добавить сквозные тесты import → full sync и отказоустойчивость

**Files:**

- Create: `packages/core/metadata/fullSyncToXml/integration.test.ts`
- Create: `packages/core/metadata/fullSyncToXml/determinism.test.ts`
- Create: `packages/core/metadata/fullSyncToXml/failureIntegration.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` — удалить/перенести только тесты публичного full-sync API; legacy unit tests reference-механизма оставить у legacy-функций.

**Step 1: Write integration tests using temporary directories**

Покрыть:

- import небольшой существующей XML-фикстуры → Проект+index → full sync без XML-reference;
- восстановление ожидаемых XML-полей/ID/order, а не `XML_REFERENCE_RAW`;
- форму с `ПутьКДанным` через shared owner metadata;
- один YAML с несколькими объявленными XML-выходами;
- внешние файлы, `Configuration.xml`, `ConfigDumpInfo.xml`;
- добавленный объект с новыми стабильными ID;
- удалённый объект отсутствует в XML и новом индексе;
- byte-for-byte одинаковые XML и `.bin` в двух копиях Проекта при `concurrency: 1` и `4`;
- crash/error второго прохода и transfer оставляет старый index;
- непустой target не изменяется.

Не изменять fixture; каждый тест копирует либо импортирует её во временный каталог.

**Step 2: Run tests and diagnose any RED by layer**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/integration.test.ts metadata/fullSyncToXml/determinism.test.ts metadata/fullSyncToXml/failureIntegration.test.ts
```

Expected initially: any failures point to a missed route/index restoration. Fix in the owning module, not with itemType branches in coordinator/worker.

**Step 3: Run core regression suite**

```bash
pnpm --filter @nkdk/core test
```

Expected: PASS, no individual test over 5 seconds.

**Step 4: Commit**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :white_check_mark: проверить полную XML-синхронизацию"
```

---

### Task 17: Финальная проверка и профиль ERP

**Files:**

- Modify if measurements need existing profiler events only: `packages/core/metadata/validation/profile.ts`
- Modify: `docs/superpowers/specs/2026-07-20-full-xml-sync-design.md` only if implementation exposed a factual mismatch; do not weaken the approved behavior.

**Step 1: Scan for forbidden legacy dependencies in the new path**

```bash
rg -n "referenceDir|readReferenceModel|syncConfigurationIncrementallyToXML|readXmlSyncState" packages/core/metadata/fullSyncToXml packages/cli/src/commands/sync.ts packages/mcp/src/services/syncToXml.ts packages/mcp/src/contracts/syncToXml.ts
```

Expected: no matches.

```bash
rg -n "Формы|Макеты|ClientApplicationForm|itemType ===|switch \(.*itemType" packages/core/metadata/fullSyncToXml packages/core/metadata/project packages/core/metadata/orchestration
```

Expected: no new concrete conditions in general layers; any existing unrelated match must be reviewed, not mechanically changed.

**Step 2: Run all static and automated checks**

```bash
pnpm type-check
pnpm test
```

Expected: PASS in every package.

**Step 3: Run an out-of-suite ERP profile with four workers**

Создать новый временный корень через `mktemp -d`, использовать отсутствующий дочерний XML-target и не очищать пользовательские каталоги.

```bash
SYNC_PROFILE_ROOT=$(mktemp -d /private/tmp/nkdk-full-sync-profile.XXXXXX)
/usr/bin/time -l pnpm --filter @nkdk/cli exec nkdk sync /Users/nikita/git/nkdk-yaml/cf "$SYNC_PROFILE_ROOT/xml" --workers 4
```

Expected:

- операция завершается успешно;
- в профиле отдельно видны discovery, первый проход, второй проход, external transfer, `ConfigDumpInfo.xml`, index commit;
- peak RSS и длительности записаны в итоговый отчёт реализации;
- обычные тесты не используют временные ожидания и остаются короче 5 секунд каждый.

Если CLI синтаксис использует `--concurrency`, применять итоговое имя из Task 15 и синхронно обновить эту команду в плане.

**Step 4: Commit any profiler/documentation corrections**

```bash
git add packages/core/metadata/validation/profile.ts docs/superpowers/specs/2026-07-20-full-xml-sync-design.md
git diff --cached --quiet
```

Если предыдущая команда завершилась кодом `1`, выполнить:

```bash
git commit -m "chore: :wrench: уточнить профиль полной синхронизации"
```

**Step 5: Final repository evidence**

```bash
git status --short
git log --oneline --decorate -18
```

Expected: clean worktree and one focused commit per completed task.

---

## Coverage Checklist

- [ ] XML-reference отсутствует во входах и новом runtime path.
- [ ] Файл индекса обязателен и читается/проверяется один раз.
- [ ] Полный decoded index не копируется в worker.
- [ ] Один YAML принадлежит одному assignment и одному worker.
- [ ] Первый проход читает, хэширует и разбирает одни и те же байты.
- [ ] Второй проход не читает соседние YAML.
- [ ] Все XML paths и внешние routes известны до второго прохода.
- [ ] Worker пишет XML непосредственно в target.
- [ ] Main копирует внешние файлы только после успеха worker.
- [ ] `Configuration.xml` строит root assignment, `ConfigDumpInfo.xml` — main.
- [ ] Новый index содержит только текущие project files и фактически использованные XML-данные.
- [ ] Index commit выполняется последним и атомарно.
- [ ] Ошибка оставляет partial XML и прежний index.
- [ ] Результат идентичен при 1/4 worker.
- [ ] Публичные CLI/MCP API не вызывают legacy incremental/reference path.
- [ ] `pnpm type-check` и `pnpm test` проходят полностью.

## Placeholder and Type Consistency Scan

Перед началом исполнения и после каждого изменения публичных договоров выполнить:

```bash
rg -n "TODO|TBD|placeholder|as any|as unknown" packages/core/metadata/fullSyncToXml packages/core/metadata/configurationIndex
rg -n "FullXmlSync|SharedConfigurationIndexSnapshot|ConfigurationIndexExportRuntime" packages/core packages/cli packages/mcp
```

Ожидается отсутствие заглушек; неизбежные приведения типов допускаются только в узкой границе registry/worker serialization, с именованным переходником и тестом.
