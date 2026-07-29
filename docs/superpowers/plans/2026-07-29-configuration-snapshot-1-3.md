# Configuration Snapshot 1.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести `configuration-index.bin` на логическую модель снимка 1.3: одна содержательная `entity` на `logicalAddress`, точный исходный файл, только идентификаторы, четыре вида `omittedChildren` и невосстановимое XML-представление.

**Architecture:** Каталог и публичный путь `metadata/configurationIndex` сохраняются, чтобы не смешивать изменение формата с переименованием всей подсистемы. Внутри него старые независимые наборы заменяются моделью `ConfigurationSnapshot`; worker передают фрагменты целых `entity`, координатор объединяет их независимо от порядка worker, а двоичный codec хранит каждую `entity` одной переменной записью. Validation-индексы, зависимости и полный состав logical address вычисляются из актуального YAML для текущей операции и в снимок не записываются.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, Piscina, существующий двоичный контейнер с xxHash128, `pnpm`.

## Global Constraints

- Логическая версия снимка и версия контейнера: ровно `1.3`.
- Старые снимки `2.0` не мигрируются; reader сообщает о необходимости повторного import XML.
- Постоянное хранилище — один двоичный `configuration-index.bin` на компонент; SQLite и SQL не добавляются.
- XML-фикстуры не изменяются.
- Общие metadata-слои не получают условий по `itemType`, XML-корням, `Формы`, `Макеты` или конкретным property-типам.
- Обычный порядок XML-свойств задаёт `rules.ts`; порядок коллекций берётся из YAML.
- `omittedChildren` разрешён только регистрациям `ConfigurationChildObjects`, `ChildFormNames`, `ChildTemplateNames` и `ChildFileItemNames`.
- `present`, `aliases`, общий `order`, `excludedEqualName`, `userSettingsId`, `producerVersion`, `baseFingerprint`, `configurationVersion`, validation-индексы, зависимости и отдельный список logical address не кодируются.
- `entity` без `identities`, `omittedChildren` и `xml` запрещена.
- Каждая `entity.sourceProjectPath` обязана ссылаться на существующий `files.projectPath`.
- При конфликте файла или содержательного поля одного `logicalAddress` операция завершается ошибкой.
- Запись снимка атомарна; при ошибке старый опубликованный файл остаётся неизменным.
- Перед завершением реализации обязателен полный `pnpm test` из корня worktree.

---

## File Structure

Существующий каталог `packages/core/metadata/configurationIndex` остаётся границей подсистемы. Изменения распределяются так:

- `types.ts` — только логическая модель 1.3 и формат worker-фрагмента.
- `collector/writer.ts` — builder содержательных `entity` одного задания.
- `fragment.ts` — перенос фрагментов между worker и детерминированное объединение.
- `encode.ts`, `decode.ts` — строгий двоичный codec 1.3.
- `sharedSnapshot.ts` — потоковый reader с поиском `file` и `entity`.
- `exportRuntime.ts`, `referenceView.ts` — адаптеры `identity`, `xml` и `omittedChildren` поверх целой `entity`.
- `fileIO.ts` — чтение и атомарная публикация.
- `project/componentState/indexes.ts` — вычисление временных validation/dependency/address индексов только из актуального Проекта.
- `importFromXml/*`, `fullSyncToXml/*` — формирование и замена `entity` по точным путям файлов.
- Конкретные property-типы — единственные владельцы правил записи и восстановления `omittedChildren`.
- `scripts/measure-configuration-snapshot.mjs` — проверка состава и размера готового снимка без раскрытия физических секций в публичной спецификации.

---

### Task 1: Ввести логическую модель `entity`, builder и worker-фрагменты

**Files:**
- Modify: `packages/core/metadata/configurationIndex/types.ts`
- Modify: `packages/core/metadata/configurationIndex/collector/writer.ts`
- Modify: `packages/core/metadata/configurationIndex/collector/writer.test.ts`
- Modify: `packages/core/metadata/configurationIndex/fragment.ts`
- Modify: `packages/core/metadata/configurationIndex/fragment.test.ts`
- Modify: `packages/core/metadata/configurationIndex/testData.ts`
- Modify: `packages/core/metadata/configurationIndex/index.ts`

**Interfaces:**
- Consumes: существующие logical-address builders из `logicalAddress.ts`.
- Produces:

```ts
export interface ConfigurationSnapshot {
  readonly specificationVersion: "1.3"
  readonly indexGeneration: bigint
  readonly componentPath: string
  readonly files: readonly ConfigurationSnapshotFile[]
  readonly entities: readonly ConfigurationSnapshotEntity[]
}

export interface ConfigurationSnapshotFile {
  readonly projectPath: string
  readonly contentHash: bigint
}

export interface ConfigurationSnapshotEntity {
  readonly logicalAddress: string
  readonly sourceProjectPath: string
  readonly identities?: {
    readonly uuid?: string
    readonly xmlId?: string
    readonly xmlName?: string
  }
  readonly omittedChildren?: OmittedChildren
  readonly xml?: ConfigurationSnapshotXml
}

export type OmittedChildren =
  | { readonly kind: "names"; readonly names: readonly string[] }
  | {
      readonly kind: "typedNames"
      readonly items: readonly {
        readonly xmlName: string
        readonly name: string
      }[]
    }

export interface ConfigurationSnapshotXml {
  readonly extended?: true
  readonly xsiNil?: true
  readonly explicitEmpty?: true
  readonly xsiType?: string
  readonly xmlText?: string
  readonly xmlPrefix?: string
}

export interface ConfigurationSnapshotFragment {
  readonly targetProjectPath: string
  readonly entities: readonly ConfigurationSnapshotEntity[]
}

export interface MergedConfigurationSnapshotFragments {
  readonly sourceProjectPaths: readonly string[]
  readonly entities: readonly ConfigurationSnapshotEntity[]
}
```

- Produces collector methods:

```ts
setIdentity(address: string, kind: "uuid" | "xmlId" | "xmlName", value: string): void
setOmittedChildren(address: string, value: OmittedChildren): void
setXmlFlag(address: string, field: "extended" | "xsiNil" | "explicitEmpty"): void
setXmlValue(address: string, field: "xsiType" | "xmlText" | "xmlPrefix", value: string): void
fragment(targetProjectPath: string): ConfigurationSnapshotFragment
```

- Produces `mergeConfigurationIndexFragments(buffers): MergedConfigurationSnapshotFragments`.

- [ ] **Step 1: Переписать тесты collector на целые `entity`**

Добавить проверки, что пустые адреса не попадают во фрагмент, пустой `xmlName` сохраняется, а конфликт любого поля отклоняется:

```ts
it("собирает одну содержательную entity и назначает путь задания", () => {
  const collector = createConfigurationIndexCollector()
  collector.setIdentity("Справочник.Товары", "uuid", UUID)
  collector.setIdentity("Справочник.Товары", "xmlName", "")
  collector.setXmlFlag("Справочник.Товары.Свойство.Тип", "xsiNil")

  expect(collector.fragment("Справочники/Товары.yaml")).toEqual({
    targetProjectPath: "Справочники/Товары.yaml",
    entities: [
      {
        logicalAddress: "Справочник.Товары",
        sourceProjectPath: "Справочники/Товары.yaml",
        identities: { uuid: UUID, xmlName: "" },
      },
      {
        logicalAddress: "Справочник.Товары.Свойство.Тип",
        sourceProjectPath: "Справочники/Товары.yaml",
        xml: { xsiNil: true },
      },
    ],
  })
})

it("не создаёт entity только из logicalAddress и пути", () => {
  expect(createConfigurationIndexCollector().fragment("Конфигурация.yaml").entities).toEqual([])
})

it("отклоняет разные значения одного поля", () => {
  const collector = createConfigurationIndexCollector()
  collector.setIdentity("Справочник.Товары", "xmlId", "one")
  expect(() => collector.setIdentity("Справочник.Товары", "xmlId", "two"))
    .toThrow("Конфликт logicalAddress Справочник.Товары")
})
```

Удалить тест режима `conflictingXmlId: "keepFirst"`: спецификация требует ошибку конфликта.

- [ ] **Step 2: Запустить тест collector и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/configurationIndex/collector/writer.test.ts
```

Expected: FAIL из-за отсутствия `setIdentity`, `setXmlFlag` и модели `entities`.

- [ ] **Step 3: Заменить старые типы и реализовать builder**

В `types.ts` удалить `ConfigurationIdentity`, `ConfigurationXmlNode`, `ConfigurationXmlValue`, `ConfigurationLocalIndexes`, `ConfigurationLocalDependency`, `ComponentLogicalAddress` и `ConfigurationIndexData`. Добавить интерфейсы из блока `Interfaces`.

В collector хранить `Map<string, MutableEntity>`. `fragment()` должен:

```ts
fragment(targetProjectPath: string): ConfigurationSnapshotFragment {
  const entities = [...this.entities.values()]
    .flatMap((entity) => {
      const normalized = normalizeEntity(entity, targetProjectPath)
      return normalized === undefined ? [] : [normalized]
    })
    .sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))

  return { targetProjectPath, entities }
}
```

`normalizeEntity` удаляет пустые группы, но считает `xmlName: ""` значением. `setIdentity` отклоняет пустые `uuid`/`xmlId`, проверяет UUID, но допускает пустой `xmlName`. `setOmittedChildren` отклоняет пустой список и делает глубокую копию.

- [ ] **Step 4: Переписать тесты фрагментов на объединение целых `entity`**

Покрыть одинаковые повторные наблюдения, конфликт пути, конфликт содержимого, пустой фрагмент и независимость от порядка буферов:

```ts
it("объединяет фрагменты независимо от порядка worker", () => {
  const left = encodeConfigurationIndexFragments([fragment("Б.yaml", entity("Б", "Б.yaml"))])
  const right = encodeConfigurationIndexFragments([fragment("А.yaml", entity("А", "А.yaml"))])

  expect(mergeConfigurationIndexFragments([left, right]))
    .toEqual(mergeConfigurationIndexFragments([right, left]))
  expect(mergeConfigurationIndexFragments([left, right]).sourceProjectPaths)
    .toEqual(["А.yaml", "Б.yaml"])
})

it("отклоняет один logicalAddress из разных файлов", () => {
  const left = encodeConfigurationIndexFragments([fragment("А.yaml", entity("Объект", "А.yaml"))])
  const right = encodeConfigurationIndexFragments([fragment("Б.yaml", entity("Объект", "Б.yaml"))])
  expect(() => mergeConfigurationIndexFragments([left, right]))
    .toThrow("разные sourceProjectPath")
})
```

- [ ] **Step 5: Реализовать конверт фрагментов версии 3**

Использовать magic `NKDKCIF3`, `version: 3`, общий локальный пул строк и форму:

```ts
interface FragmentEnvelope {
  readonly magic: "NKDKCIF3"
  readonly version: 3
  readonly strings: readonly string[]
  readonly fragments: readonly {
    readonly targetProjectPathStringId: number
    readonly entities: readonly EncodedFragmentEntity[]
  }[]
}
```

Каждая декодированная `entity.sourceProjectPath` должна совпадать с `targetProjectPath`; пустые `entity`, неизвестные поля и варианты `omittedChildren` отклоняются. Merge объединяет одинаковые значения, а не просто запрещает повторный адрес, и сортирует пути и адреса сравнением UTF-8.

- [ ] **Step 6: Запустить модульные тесты collector и фрагментов**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/configurationIndex/collector/writer.test.ts \
  metadata/configurationIndex/fragment.test.ts
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать модель и фрагменты**

```bash
git add packages/core/metadata/configurationIndex
git commit -m "feat: :sparkles: ввести сущности снимка конфигурации"
```

---

### Task 2: Переписать двоичный codec на строгий формат 1.3

**Files:**
- Modify: `packages/core/metadata/configurationIndex/encode.ts`
- Modify: `packages/core/metadata/configurationIndex/encode.test.ts`
- Modify: `packages/core/metadata/configurationIndex/decode.ts`
- Modify: `packages/core/metadata/configurationIndex/decode.test.ts`
- Modify: `packages/core/metadata/configurationIndex/stringPool.test.ts`
- Modify: `packages/core/metadata/configurationIndex/testData.ts`

**Interfaces:**
- Consumes: `ConfigurationSnapshot` из Task 1.
- Produces:

```ts
encodeConfigurationIndex(snapshot: ConfigurationSnapshot): Buffer
decodeConfigurationIndex(
  input: Uint8Array,
  options?: { expectedComponentPath?: string }
): ConfigurationSnapshot
```

**Физическая раскладка 1.3:**

| Секция | Тип | Запись |
|---|---:|---|
| `SNAPSHOT` | 1 | `indexGeneration:u64`, `componentPathStringId:u32`, остальное reserved до 16 байт |
| `STRINGS` | 2 | существующая переменная запись `byteLength:u32 + UTF-8 + padding` |
| `FILES` | 3 | `projectPathStringId:u32`, reserved `u32`, `contentHash:u64` |
| `ENTITIES` | 4 | одна переменная запись на целую логическую `entity`, описанная ниже |

Заголовок сохраняет magic `NKDK1CIX`, но содержит `majorVersion = 1`, `minorVersion = 3`, `sectionCount = 4`. Контрольная сумма каталога и каждой секции сохраняется.

Запись `ENTITIES`:

```text
u32 byteLength
u32 logicalAddressStringId
u32 sourceProjectPathStringId
u32 fieldMask
[16 bytes uuid]                     if UUID
[u32 xmlIdStringId]                 if XML_ID
[u32 xmlNameStringId]               if XML_NAME
[u32 omittedCount, u32 reserved]    if OMITTED_NAMES or OMITTED_TYPED_NAMES
[u32 nameStringId] * count          if OMITTED_NAMES
[u32 xmlNameStringId, u32 nameStringId] * count
                                     if OMITTED_TYPED_NAMES
[u32 xsiTypeStringId]               if XSI_TYPE
[u32 xmlTextStringId]               if XML_TEXT
[u32 xmlPrefixStringId]             if XML_PREFIX
padding to 8 bytes
```

`byteLength` — число байтов после самого `u32 byteLength` до padding. Полная
длина записи равна `align8(4 + byteLength)`, а padding обязан состоять из
нулей.

Биты `fieldMask`:

```ts
const ENTITY_FLAGS = {
  uuid: 1 << 0,
  xmlId: 1 << 1,
  xmlName: 1 << 2,
  omittedNames: 1 << 3,
  omittedTypedNames: 1 << 4,
  extended: 1 << 5,
  xsiNil: 1 << 6,
  explicitEmpty: 1 << 7,
  xsiType: 1 << 8,
  xmlText: 1 << 9,
  xmlPrefix: 1 << 10,
} as const
```

`xmlName: ""` кодируется установленным битом и обычным ненулевым string ID пустой строки. Одновременно установленные `omittedNames` и `omittedTypedNames` запрещены.

- [ ] **Step 1: Заменить encode-тесты моделью 1.3**

Создать `sampleSnapshot()` с двумя файлами и entity, содержащими все поля. Проверить:

```ts
expect(encoded.subarray(0, 8).toString("ascii")).toBe("NKDK1CIX")
expect(encoded.readUInt16LE(8)).toBe(1)
expect(encoded.readUInt16LE(10)).toBe(3)
expect(encoded.readUInt32LE(24)).toBe(4)
expect(encodeConfigurationIndex(sampleSnapshot()))
  .toEqual(encodeConfigurationIndex(reverseInputOrder(sampleSnapshot())))
```

Добавить отдельные ошибки для повторного `projectPath`, повторного `logicalAddress`, пустой `entity`, отсутствующего файла, недопустимого UUID, пустых `omittedChildren`, абсолютного/выходящего вверх пути.

- [ ] **Step 2: Запустить encode-тест и подтвердить падение на старом формате**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/configurationIndex/encode.test.ts
```

Expected: FAIL: контейнер имеет версию `2.0`, 12 секций и старые поля.

- [ ] **Step 3: Реализовать нормализацию и кодирование 1.3**

Перед построением пула строк:

```ts
const files = [...snapshot.files].sort((a, b) => compareUtf8(a.projectPath, b.projectPath))
const entities = [...snapshot.entities].sort((a, b) => compareUtf8(a.logicalAddress, b.logicalAddress))
validateSnapshot({ ...snapshot, files, entities })
```

`validateSnapshot` проверяет все глобальные инварианты. Строковый пул строится только из реально используемых значений; `STRINGS` не должен содержать строк без ссылки. Удалить код секций `IDENTITIES`, `XML_ORDERS`, `XML_NODES`, `XML_VALUES`, трёх validation-блоков, `LOCAL_DEPENDENCIES` и `LOGICAL_ADDRESSES`.

- [ ] **Step 4: Переписать decode-тесты на проверки контейнера и модели**

Проверить полное декодирование, пустой `xmlName`, повреждение каждого вида смещения/длины/хэша/UTF-8/reserved, неизвестный бит, конфликт omitted-вариантов, повторный адрес и старую версию:

```ts
expect(() => decodeConfigurationIndex(old20Header))
  .toThrowError(ConfigurationIndexCompatibilityError)
expect(() => decodeConfigurationIndex(old20Header))
  .toThrow("требуется повторный import")
```

- [ ] **Step 5: Реализовать строгий decoder 1.3**

Decoder выполняет проверки в порядке: заголовок → каталог → размещение секций → хэши → UTF-8 строк → структура записей → уникальность → перекрёстные ссылки → `expectedComponentPath`. Удалить `expectedProducerVersion`: совместимость определяется только версией спецификации, а не версией NKDK.

Возвращаемая модель всегда имеет:

```ts
{
  specificationVersion: "1.3",
  indexGeneration,
  componentPath,
  files,
  entities,
}
```

- [ ] **Step 6: Запустить тесты codec и type-check**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/configurationIndex/encode.test.ts \
  metadata/configurationIndex/decode.test.ts \
  metadata/configurationIndex/stringPool.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать codec 1.3**

```bash
git add packages/core/metadata/configurationIndex
git commit \
  -m "feat!: :sparkles: записывать снимок конфигурации 1.3" \
  -m "BREAKING CHANGE: снимки 2.0 больше не читаются; требуется повторный import XML."
```

---

### Task 3: Перевести reader и запись файла на целые `entity`

**Files:**
- Modify: `packages/core/metadata/configurationIndex/sharedSnapshot.ts`
- Modify: `packages/core/metadata/configurationIndex/sharedSnapshot.test.ts`
- Modify: `packages/core/metadata/configurationIndex/fileIO.ts`
- Modify: `packages/core/metadata/configurationIndex/fileIO.test.ts`
- Modify: `packages/core/metadata/configurationIndex/exportRuntime.ts`
- Modify: `packages/core/metadata/configurationIndex/exportRuntime.test.ts`
- Modify: `packages/core/metadata/configurationIndex/referenceView.ts`
- Modify: `packages/core/metadata/configurationIndex/referenceView.test.ts`
- Modify: `packages/core/tests/directConversion.ts`

**Interfaces:**
- Consumes: codec и модель Tasks 1–2.
- Produces:

```ts
export interface ConfigurationIndexReader {
  readonly snapshot: SharedConfigurationIndexSnapshot
  header(): Pick<ConfigurationSnapshot, "specificationVersion" | "indexGeneration" | "componentPath">
  file(projectPath: string): ConfigurationSnapshotFile | undefined
  files(): Iterable<ConfigurationSnapshotFile>
  entity(logicalAddress: string): ConfigurationSnapshotEntity | undefined
  entities(): Iterable<ConfigurationSnapshotEntity>
  entitiesBySourceProjectPath(projectPath: string): Iterable<ConfigurationSnapshotEntity>
}
```

- Produces runtime adapters:

```ts
identity(kind: "uuid" | "xmlId" | "xmlName", address?: string): string | undefined
xml(address?: string): ConfigurationSnapshotXml | undefined
omittedChildren(address?: string): OmittedChildren | undefined
```

- [ ] **Step 1: Переписать reader-тесты на смысловой API**

Проверить точечный поиск, сортированный потоковый обход, выборку по файлу и отсутствие публичных `identities()`, `xmlNodes()`, `xmlValue()`:

```ts
const reader = createConfigurationIndexReader(snapshotConfigurationIndex(encoded))
expect(reader.header()).toEqual({
  specificationVersion: "1.3",
  indexGeneration: 1n,
  componentPath: "cf",
})
expect(reader.entity("Справочник.Товары")?.identities?.uuid).toBe(UUID)
expect([...reader.entitiesBySourceProjectPath("Справочники/Товары.yaml")])
  .toEqual([reader.entity("Справочник.Товары")])
```

- [ ] **Step 2: Запустить reader-тест и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/configurationIndex/sharedSnapshot.test.ts
```

Expected: FAIL из-за старого API `binding/identity/xmlNode/xmlValue`.

- [ ] **Step 3: Реализовать индексы смещений для `FILES` и `ENTITIES`**

`snapshotConfigurationIndex` сначала полностью валидирует контейнер через decoder, затем один раз строит разделяемые массивы смещений переменных записей `STRINGS` и `ENTITIES`. Reader лениво строит:

```ts
private stringIds?: Map<string, number>
private fileOffsetByPathId?: Map<number, number>
private entityOffsetByAddressId?: Map<number, number>
private entityOffsetsBySourcePathId?: Map<number, readonly number[]>
```

`entities()` и `files()` возвращают итераторы в UTF-8 порядке, не вызывая полное `decodeConfigurationIndex`.

- [ ] **Step 4: Перевести export runtime и reference view**

`ConfigurationIndexExportRuntime` читает одну `entity`, а старые вызовы переводятся так:

```ts
identity(kind, address = this.logicalAddress) {
  return this.source.entity(address)?.identities?.[kind]
}

xml(address = this.logicalAddress) {
  return this.source.entity(address)?.xml
}

omittedChildren(address = this.xmlNodeLogicalAddress ?? this.logicalAddress) {
  return this.source.entity(address)?.omittedChildren
}
```

Сохранить детерминированную генерацию UUID/xmlId, но seed строить из байтов снимка и следующего `indexGeneration`, полученного из `source.header()`. В `referenceView.ts` оставить только адаптеры identity/XML и новый:

```ts
export function getConfigurationIndexOmittedChildren(
  context: ConfigurationContextWithExportToXML | undefined
): OmittedChildren | undefined {
  return context?.exportToXML.configurationIndex?.omittedChildren()
}
```

Удалить `getConfigurationIndexPropertyOrder`, `getConfigurationIndexSourceXmlKey`, `isConfigurationIndexPropertyPresent` и `isConfigurationIndexPropertyExcludedEqualName`.

- [ ] **Step 5: Написать тест атомарной публикации**

В `fileIO.test.ts` проверить, что при ошибке `rename` старый снимок читается без изменений, временный файл удаляется, а успешная запись не оставляет временных файлов.

- [ ] **Step 6: Реализовать атомарную запись**

Записывать файл в том же каталоге с уникальным именем `.configuration-index.bin.<pid>.<nonce>.tmp`:

```ts
const handle = await fs.promises.open(temporary, "wx")
try {
  await handle.writeFile(encodeConfigurationIndex(params.data))
  await handle.sync()
} finally {
  await handle.close()
}
await fs.promises.rename(temporary, target)
const directoryHandle = await fs.promises.open(directory, "r")
try {
  await directoryHandle.sync()
} finally {
  await directoryHandle.close()
}
```

В `catch` удалять только вычисленный временный файл через `unlink`; итоговый файл не трогать. `readConfigurationIndex` и `readConfigurationIndexSnapshot` проверяют только `expectedComponentPath`.

- [ ] **Step 7: Запустить тесты reader/runtime/fileIO**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/configurationIndex/sharedSnapshot.test.ts \
  metadata/configurationIndex/exportRuntime.test.ts \
  metadata/configurationIndex/referenceView.test.ts \
  metadata/configurationIndex/fileIO.test.ts \
  tests/directConversion.ts
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать reader и атомарную запись**

```bash
git add packages/core/metadata/configurationIndex packages/core/tests/directConversion.ts
git commit -m "feat: :sparkles: читать и публиковать сущности снимка"
```

---

### Task 4: Удалить общее сохранение порядка, `present`, aliases и лишние XML-флаги

**Files:**
- Modify: `packages/core/metadata/configurationIndex/collector/collectProperty.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/event/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/event/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/event/toXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/ganttChartFieldTable/types.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/ruleFactory.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.test.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/register.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/configurationIndex.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/userSettingsID/fromXMLToYAML.test.ts`

**Interfaces:**
- Consumes: `rules.ts`, порядок JS/YAML-объектов, `ConfigurationSnapshotXml`.
- Produces: общий слой собирает только `extended`, `xsiNil`, `explicitEmpty`, `xsiType`, `xmlText`, `xmlPrefix`; порядок и наличие не входят в его API.

- [ ] **Step 1: Добавить отрицательные тесты состава снимка**

В property- и collection-тестах импортировать XML с:

- отсутствующим и явно заданным default-свойством;
- XML alias;
- событиями `A.Before → B → A.After`;
- стандартными реквизитами;
- DCS/CommandInterface/ClientApplicationInterface коллекциями.

После преобразования проверить:

```ts
expect(fragment.entities.flatMap((entity) => Object.keys(entity))).not.toContain("present")
expect(JSON.stringify(fragment.entities)).not.toMatch(/aliases|excludedEqualName|userSettingsId|order/)
```

Для событий проверить, что результат следует порядку ключей YAML:

```ts
expect(exported.Event.map(({ _name, _callType }) => [_name, _callType])).toEqual([
  ["A", "Before"],
  ["A", "After"],
  ["B", undefined],
])
```

Для стандартных реквизитов ожидаемый XML-порядок брать из `rules.ts`, включая вычисляемые `ExtDimension*`.

- [ ] **Step 2: Запустить затронутые тесты и подтвердить падение из-за старых наблюдений**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts \
  metadata/forms/commonObjects/event/toXML.test.ts \
  metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts
```

Expected: FAIL: старый collector продолжает сохранять `present`, aliases и order.

- [ ] **Step 3: Удалить запись и чтение `present`, aliases, `excludedEqualName`, `userSettingsId`**

Удалить соответствующие ветки из `fromXMLToYAML.ts`, `fromYAMLToXML.ts`, helpers и descriptor `userSettingsIdFromSource`. Пустой `_name` теперь записывается только так:

```ts
if (params.sourceXmlKey === "_name" &&
    !isNameReconstructible(collection.logicalAddress, params.xmlValue, params.reconstructibleXmlName)) {
  collection.collector.setIdentity(collection.logicalAddress, "xmlName", params.xmlValue)
}
```

XML-ключ свойства всегда выбирается из `rule.xml ?? capitalize(propertyKey)`. Отсутствие сохранённого `present` не должно принуждать к выводу default: решение остаётся за `implicitValueYAML`, `defaultValueXML`, `defaultValueXMLEmpty`, `required` и конкретной регистрацией.

- [ ] **Step 4: Удалить общий порядок коллекций**

Удалить `preserveOmittedItemNames` из типов и generic metadata collection orchestration. Коллекция экспортируется в порядке `Object.entries(yaml)` или массива YAML; `completeItemNames` добавляет вычисляемые элементы в порядке, заданном регистрацией/rules, но не читает снимок.

Из `StandardAttributeDescriptions` убрать `preserveOmittedItemNames: true`. Порядок канонических имён задаёт `standartAttributeNamesXML`/`standartAttributeNames`, а динамические `ExtDimension*` добавляются существующим правилом.

- [ ] **Step 5: Перевести события и остальные бывшие потребители общего order**

Для `Events` удалить `collectConfigurationIndexFromXML`; `expandEventBindings` должен обходить YAML-объект без сортировки по снимку. Для вызовов одного события использовать порядок ключей YAML-объекта, а при его отсутствии — `EVENT_CALL_TYPES_XML`.

Для `ClientApplicationInterface`, DCS structure topology, `CommandInterface` удалить `setOrder/xmlNode().order`; экспорт использует порядок соответствующего YAML-массива/объекта и зарегистрированных правил. Обновить тесты на канонический XML, не меняя XML-фикстуры.

- [ ] **Step 6: Упростить base-form projection**

`createBaseFormConfigurationIndexReader` должен проецировать только целые `entity`: identity берётся из extension для `extensionIdentityAddresses`, остальные сохранённые поля — из base. Удалить `BaseFormNodeProjection`, `present`-проекцию и alias-проекцию; выбор свойств формы остаётся в `baseForm.ts` и `selectedPropertyKeys`, а порядок — в `getCompiledXMLPropertyOrder(rule)`.

- [ ] **Step 7: Запустить все тесты затронутых общих преобразований**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/orchestration/property \
  metadata/orchestration/metadataCollection \
  metadata/forms/commonObjects/event \
  metadata/forms/clientApplicationForm/baseFormIndex.test.ts \
  metadata/commonObjects/clientApplicationInterface \
  metadata/commonObjects/dataCompositionSystem/structureItemGroup \
  metadata/forms/commonObjects/commandInterface \
  metadata/commonObjects/standardAttributeDescription
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать удаление общего состояния XML**

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: получать общий порядок из YAML и rules"
```

---

### Task 5: Зарегистрировать четыре допустимых варианта `omittedChildren`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/configurationChildObjects.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/configurationChildObjects.test.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/childFileItemNames/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childFileItemNames/toXML.ts`
- Create: `packages/core/metadata/commonObjects/omittedChildren.ts`
- Create: `packages/core/metadata/commonObjects/omittedChildren.test.ts`

**Interfaces:**
- Consumes: `collector.setOmittedChildren` и `runtime.omittedChildren`.
- Produces нейтральные helpers:

```ts
mergeOmittedNames(current: readonly string[], saved: OmittedChildren | undefined): string[]
readOmittedNames(saved: OmittedChildren | undefined, propertyType: string): readonly string[] | undefined
readOmittedTypedNames(
  saved: OmittedChildren | undefined,
  propertyType: string
): readonly { xmlName: string; name: string }[] | undefined
```

Helpers знают только варианты модели; конкретный property-тип передаёт своё имя для диагностического сообщения. Регистрация конкретного типа остаётся в файле этого типа.

- [ ] **Step 1: Написать тесты совместимого восстановления**

Проверить алгоритм: сохранённые имена, которые ещё существуют, идут в исходном порядке; новые имена добавляются в порядке актуального источника; удалённые исчезают; дубли запрещены.

```ts
expect(mergeOmittedNames(["Новая", "Б", "А"], {
  kind: "names",
  names: ["А", "Удалена", "Б"],
})).toEqual(["А", "Б", "Новая"])
```

Для несовпадающего варианта:

```ts
expect(() => readOmittedNames({ kind: "typedNames", items: [] }, "ChildFormNames"))
  .toThrow("ChildFormNames ожидает omittedChildren.kind = names")
```

- [ ] **Step 2: Запустить тест helpers и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/commonObjects/omittedChildren.test.ts
```

Expected: FAIL: модуль ещё не существует.

- [ ] **Step 3: Реализовать helpers и `ConfigurationChildObjects`**

`ConfigurationChildObjects` записывает:

```ts
collection.collector.setOmittedChildren(address, {
  kind: "typedNames",
  items: Object.entries(xml).flatMap(([xmlName, value]) =>
    normalizeNames(value).map((name) => ({ xmlName, name }))
  ),
})
```

При export отфильтровать сохранённые пары по актуальному составу объектов, сохранить чередование XML-видов, новые пары добавить в порядке актуальной структуры Проекта. Удалить JSON-кодирование пар в строки.

- [ ] **Step 4: Перевести три именных property-типа**

`ChildFormNames`, `ChildTemplateNames`, `ChildFileItemNames` записывают `{ kind: "names", names }`, читают только этот вариант, вызывают `mergeOmittedNames`, а после успешного export снова записывают итоговый список в collector. Для пустого актуального состава `omittedChildren` не переносится.

- [ ] **Step 5: Проверить, что других писателей `omittedChildren` нет**

Run:

```bash
rg -n "setOmittedChildren" packages/core/metadata
```

Expected: вызовы только в четырёх конкретных property-типах и в collector/tests.

- [ ] **Step 6: Запустить тесты четырёх типов**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/commonObjects/omittedChildren.test.ts \
  metadata/appliedObjects/configuration/configurationChildObjects.test.ts \
  metadata/commonObjects/childFormNames \
  metadata/commonObjects/childTemplateNames \
  metadata/commonObjects/childFileItemNames
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать специальный порядок дочерних объектов**

```bash
git add packages/core/metadata/appliedObjects/configuration \
  packages/core/metadata/commonObjects
git commit -m "feat: :sparkles: сохранять пропущенный порядок дочерних объектов"
```

---

### Task 6: Отвязать временные индексы Проекта и профиль расширения от снимка

**Files:**
- Modify: `packages/core/metadata/project/componentState/indexes.ts`
- Modify: `packages/core/metadata/project/componentState/indexes.test.ts`
- Modify: `packages/core/metadata/project/componentState/types.ts`
- Modify: `packages/core/metadata/project/componentState/confirm.ts`
- Modify: `packages/core/metadata/project/componentState/confirm.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`

**Interfaces:**
- Consumes: актуальные `ComponentProjectStructure`, хэши и YAML.
- Produces: `ComponentIndexes` по-прежнему содержит временные `metadata`, `dependencies`, `logicalAddresses`, но они никогда не читаются из `ConfigurationSnapshot`.

- [ ] **Step 1: Переписать component-index tests на обязательный холодный расчёт**

Даже при переданном актуальном снимке worker pool должен быть вызван:

```ts
const indexes = await readComponentIndexes({ structure, hashes, context, snapshot, createWorkerPool })
expect(createWorkerPool).toHaveBeenCalledOnce()
expect(indexes.logicalAddresses).toContainEqual({
  logicalAddress: "Справочник.Товары",
  sourceProjectPath: "Справочники/Товары.yaml",
})
```

Добавить проверку, что logical addresses берутся из topology/YAML и могут включать адрес без `entity`.

- [ ] **Step 2: Запустить component-state tests и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/project/componentState
```

Expected: FAIL: текущий код восстанавливает индексы из `localIndexes` снимка.

- [ ] **Step 3: Удалить быстрый путь persisted indexes**

`readComponentIndexes` всегда вызывает `buildColdComponentIndexes` для content-ресурсов и объединяет:

```ts
return {
  componentPath: params.structure.componentPath,
  sourceProjectFiles: params.hashes.projectFiles,
  metadata: cold.metadata,
  dependencies: cold.dependencies,
  logicalAddresses: uniqueLogicalAddresses([
    ...topologyLogicalAddresses(params.structure),
    ...cold.logicalAddresses,
  ]),
}
```

Параметр `snapshot` удалить из `readComponentIndexes`; в координаторах больше не передавать его. `ConfirmedComponentState` сохраняет snapshot отдельно только для identifiers/XML representation.

- [ ] **Step 4: Переписать профиль расширения на актуальные адреса**

`baseAddresses` и `targetAddresses` строить из `base.indexes.logicalAddresses` и `target.indexes.logicalAddresses`. UUID искать через `reader.entity(address)?.identities?.uuid`. Признак заимствования определять пересечением актуального адреса расширения с адресом и UUID основной конфигурации; `extended` читать только из `entity.xml.extended`.

Удалить `extensionPropertyOrders`, `snapshotMarksAdopted`, `snapshotHasExtendedConfigurationObject`, `EXTENSION_PROPERTY_ORDER_SEGMENT` и `EXTENSION_INTERNAL_INFO_SEGMENT`. Сервисные XML-свойства и их порядок формировать из rules и актуального YAML/control-поля, а не из `present/order`.

- [ ] **Step 5: Запустить component-state и extension tests**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/project/componentState \
  metadata/fullSyncToXml/profiles/configurationExtension.test.ts \
  metadata/appliedObjects/configurationExtension
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать вычисление индексов из Проекта**

```bash
git add packages/core/metadata/project/componentState \
  packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts \
  packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts \
  packages/core/metadata/appliedObjects/configurationExtension
git commit -m "refactor: :recycle: вычислять индексы из актуального проекта"
```

---

### Task 7: Формировать снимок import с точным `sourceProjectPath`

**Files:**
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/core/metadata/importFromXml/metadataSnapshot.ts`
- Modify: `packages/core/metadata/importFromXml/metadataSnapshot.test.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`

**Interfaces:**
- Consumes: `MergedConfigurationSnapshotFragments` из Task 1 и `ConfigurationSnapshot` из Task 2.
- Produces: import-снимок:

```ts
{
  specificationVersion: "1.3",
  indexGeneration: 1n,
  componentPath,
  files: projectFiles,
  entities: fragmentData.entities,
}
```

- [ ] **Step 1: Добавить интеграционный тест точной принадлежности файла**

Импортировать минимум два задания и проверить не первый файл списка, а путь каждого задания:

```ts
expect(snapshot.entities.find(({ logicalAddress }) => logicalAddress === catalogAddress))
  .toMatchObject({ sourceProjectPath: "Справочники/Товары.yaml" })
expect(snapshot.entities.find(({ logicalAddress }) => logicalAddress === formAddress))
  .toMatchObject({ sourceProjectPath: "Справочники/Товары/Формы/ФормаЭлемента.yaml" })
expect(snapshot.entities.every((entity) =>
  snapshot.files.some((file) => file.projectPath === entity.sourceProjectPath)
)).toBe(true)
```

Добавить задание без содержательных фактов и проверить отсутствие пустой entity.

- [ ] **Step 2: Запустить import tests и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts \
  metadata/importFromXml/importConfiguration.test.ts
```

Expected: FAIL: координатор ещё строит `identities/xmlNodes/xmlValues/localIndexes` и назначает первый `projectPath`.

- [ ] **Step 3: Удалить dependencies из транспортного фрагмента**

`validationContribution.localDependencies` продолжает передаваться отдельно между проходами import для текущей операции. Из `ConfigurationSnapshotFragment`, fragment buffer и `ImportFirstPassResult.fragmentData` удалить `localDependencies`.

Worker возвращает:

```ts
fragment: collector.fragment(prepared.targetProjectPath)
```

и не копирует validation facts в снимок.

- [ ] **Step 4: Построить снимок import только из файлов и entity**

Удалить `serializeSharedValidationSnapshot`, `uniqueLogicalAddresses`, `NKDK_CORE_VERSION` и параметры persisted indexes из `buildImportedConfigurationIndex`. Реализовать:

```ts
function buildImportedConfigurationSnapshot(params: {
  componentPath: string
  projectFiles: readonly ConfigurationSnapshotFile[]
  fragmentData: MergedConfigurationSnapshotFragments
}): ConfigurationSnapshot {
  return {
    specificationVersion: "1.3",
    indexGeneration: 1n,
    componentPath: params.componentPath,
    files: params.projectFiles,
    entities: params.fragmentData.entities,
  }
}
```

Codec проверит, что каждый `sourceProjectPath` существует в `files`.

- [ ] **Step 5: Проверить публикацию только после успешного второго прохода**

В тесте подменить `writeIndex`, заставить второй проход или transfer внешнего файла завершиться ошибкой и проверить `expect(writeIndex).not.toHaveBeenCalled()`. Успешный тест должен проверять один вызов после hashProject.

- [ ] **Step 6: Запустить весь importFromXml набор**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/importFromXml
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать новый import-снимок**

```bash
git add packages/core/metadata/importFromXml \
  packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts
git commit -m "feat: :sparkles: привязать сущности снимка к файлам импорта"
```

---

### Task 8: Заменять `entity` изменённых файлов при sync

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/determinism.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/failureIntegration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/configurationExtensionIntegration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/testHelpers.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/resourceTopology/contracts.test.ts`

**Interfaces:**
- Consumes: предыдущий `ConfigurationSnapshot`, merged fragments с `sourceProjectPaths`, текущие `target.hashes.projectFiles`.
- Produces:

```ts
export function replaceSnapshotEntities(params: {
  readonly previous: readonly ConfigurationSnapshotEntity[]
  readonly replacements: MergedConfigurationSnapshotFragments
}): ConfigurationSnapshotEntity[]
```

- [ ] **Step 1: Написать тест замены состояния файла**

```ts
it("целиком заменяет entity изменённого файла и сохраняет неизменённый", () => {
  expect(replaceSnapshotEntities({
    previous: [
      entity("Старый", "А.yaml"),
      entity("Остаётся", "Б.yaml"),
    ],
    replacements: {
      sourceProjectPaths: ["А.yaml"],
      entities: [entity("Новый", "А.yaml")],
    },
  })).toEqual([
    entity("Новый", "А.yaml"),
    entity("Остаётся", "Б.yaml"),
  ])
})

it("удаляет все entity файла при пустом фрагменте", () => {
  expect(replaceSnapshotEntities({
    previous: [entity("Старый", "А.yaml")],
    replacements: { sourceProjectPaths: ["А.yaml"], entities: [] },
  })).toEqual([])
})
```

- [ ] **Step 2: Запустить sync tests и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/fullSyncToXml/workerPool.test.ts \
  metadata/fullSyncToXml/syncConfiguration.test.ts
```

Expected: FAIL: worker pool возвращает раздельные наборы, а coordinator заменяет снимок целиком и переносит local indexes.

- [ ] **Step 3: Передавать полные фрагменты из worker**

`writeFullXmlSyncAssignment` завершает collector вызовом `fragment(assignment.sourceProjectPath)`. Даже если `entities` пуст, фрагмент передаётся: `sourceProjectPaths` нужен для удаления старого состояния файла.

`FullXmlSyncExecutionPoolResult` содержит:

```ts
readonly fragmentData: MergedConfigurationSnapshotFragments
```

- [ ] **Step 4: Реализовать детерминированную замену**

`replaceSnapshotEntities` удаляет предыдущие entity всех `replacements.sourceProjectPaths`, добавляет новые, проверяет глобальную уникальность `logicalAddress` и сортирует UTF-8. Одинаковая entity из неизменённого файла переносится без изменения.

`buildFullXmlSyncConfigurationSnapshot`:

```ts
return {
  specificationVersion: "1.3",
  indexGeneration: previous.indexGeneration + 1n,
  componentPath: previous.componentPath,
  files: [...target.hashes.projectFiles],
  entities: replaceSnapshotEntities({
    previous: previous.entities,
    replacements: fragmentData,
  }),
}
```

Не копировать producer/version/fingerprint, validation indexes, dependencies или logical addresses.

- [ ] **Step 5: Проверить поколение, детерминизм и отказ публикации**

Добавить тесты:

- `indexGeneration` увеличивается ровно на 1 после успешной операции;
- два порядка результатов worker дают одинаковые байты;
- конфликт logical address не вызывает `writeIndex`;
- ошибка worker/transfer/валидации результата сохраняет байты старого снимка;
- entity внешнего неизменённого файла переносится;
- старые entity обработанного YAML-файла исчезают.

- [ ] **Step 6: Запустить fullSyncToXml и resourceTopology tests**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/fullSyncToXml \
  metadata/resourceTopology/contracts.test.ts
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать замену entity при sync**

```bash
git add packages/core/metadata/fullSyncToXml \
  packages/core/metadata/resourceTopology/contracts.test.ts
git commit -m "feat: :sparkles: обновлять снимок по файлам синхронизации"
```

---

### Task 9: Проверить состав на `cf/doc`, обновить активную документацию и выполнить полный прогон

**Files:**
- Create: `packages/core/scripts/measure-configuration-snapshot.mjs`
- Modify: `packages/core/package.json`
- Create: `packages/core/metadata/configurationIndex/measure.test.ts`
- Modify: `.agents/architecture.md`
- Modify: `.agents/restrictions.md`
- Modify: `.agents/configuration-snapshot.md` only if implementation revealed a mismatch; otherwise leave unchanged.

**Interfaces:**
- Consumes: `decodeConfigurationIndex` и готовый `configuration-index.bin`.
- Produces command:

```bash
pnpm --filter @nkdk/core measure:configuration-snapshot -- /absolute/path/configuration-index.bin
```

Вывод JSON:

```ts
interface ConfigurationSnapshotMeasurement {
  readonly fileBytes: number
  readonly files: { readonly records: number; readonly payloadBytes: number }
  readonly entities: {
    readonly records: number
    readonly basePayloadBytes: number
    readonly identitiesPayloadBytes: number
    readonly omittedChildrenPayloadBytes: number
    readonly xmlPayloadBytes: number
  }
  readonly strings: {
    readonly totalBytes: number
    readonly sharedBytes: number
    readonly byOwner: {
      readonly files: number
      readonly entityBase: number
      readonly identities: number
      readonly omittedChildren: number
      readonly xml: number
    }
  }
}
```

Строка, используемая несколькими группами, учитывается в `sharedBytes`, а не дублируется. Сумма физических секций, каталога, заголовка, padding и checksums должна равняться `fileBytes`; логические payload-поля выводятся отдельно и не выдаются за физические секции.

- [ ] **Step 1: Написать тест измерителя**

На `sampleSnapshot()` проверить количество записей, ненулевые размеры всех заполненных групп, `sharedBytes` для повторно используемого пути/адреса и точное равенство суммы физических байтов размеру буфера.

- [ ] **Step 2: Реализовать измеритель и package script**

Добавить:

```json
"measure:configuration-snapshot": "node scripts/measure-configuration-snapshot.mjs"
```

Скрипт принимает ровно один абсолютный путь, читает снимок через публичный decoder, проверяет 1.3 и печатает только JSON в stdout; ошибки идут в stderr и завершают процесс с кодом 1.

- [ ] **Step 3: Запустить type-check и тесты core**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm --filter @nkdk/core test
```

Expected: PASS.

- [ ] **Step 4: Выполнить import `cf/doc` во временный Проект**

Не изменять источник `/Users/nikita/git/round-trip-compact/cf/doc`. Создать временный каталог через `mktemp -d`, выполнить import штатной CLI-командой в новый проект и сохранить путь снимка из результата:

```bash
export NKDK_SNAPSHOT_PROJECT="$(mktemp -d)"
mkdir "$NKDK_SNAPSHOT_PROJECT/cf"
pnpm --filter @nkdk/mcp exec tsx -e '
  import { importFromXml } from "./src/services/importFromXml.ts";
  const result = await importFromXml({
    xmlDir: "/Users/nikita/git/round-trip-compact/cf/doc",
    projectDir: process.env.NKDK_SNAPSHOT_PROJECT,
    componentPath: "cf",
    concurrency: 4,
    allowWrite: true,
  });
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
'
```

Expected: JSON содержит `"ok":true`, а
`configurationIndexPath` указывает внутрь временного Проекта.

- [ ] **Step 5: Проверить инварианты и распределение размера `cf/doc`**

Run:

```bash
pnpm --filter @nkdk/core measure:configuration-snapshot -- \
  "$NKDK_SNAPSHOT_PROJECT/.nkdk/components/cf/configuration-index.bin"
```

Дополнительно выполнить небольшой `tsx`-скрипт чтения через decoder и проверить:

```ts
assert(snapshot.entities.length > 0)
assert(snapshot.entities.every(hasMeaningfulPayload))
assert(snapshot.entities.every((entity) => files.has(entity.sourceProjectPath)))
assert(snapshot.entities.every((entity) =>
  entity.omittedChildren === undefined ||
  entity.omittedChildren.kind === "names" ||
  entity.omittedChildren.kind === "typedNames"
))
```

В отчёте реализации привести фактические байты и проценты для `files`, base entity, identities, omittedChildren, XML и строк. Отдельно подтвердить отсутствие полей/секций `present`, общего order, aliases, `excludedEqualName`, `userSettingsId`, validation, dependencies и отдельного logical-address списка.

- [ ] **Step 6: Выполнить поддержанный XML → YAML → XML round-trip**

Использовать проектный сценарий:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc \
  ./.agents/skills/round-trip-xml/round-trip.sh
```

Expected: скрипт завершается успешно для поддержанной области; если есть известные расхождения вне снимка 1.3, зафиксировать точные diff-группы и не изменять XML-фикстуры.

- [ ] **Step 7: Обновить активную архитектуру и ограничения**

В `.agents/architecture.md` заменить описания persisted validation/dependency/logical-address секций на:

- снимок содержит только `files` и содержательные `entities`;
- validation/dependency/address индексы строятся из актуального YAML в каждой операции;
- worker fragment привязан к одному `targetProjectPath`;
- sync заменяет entity обработанного файла;
- публикация атомарна.

В `.agents/restrictions.md` удалить ограничения о прямой неатомарной записи `configuration-index.bin` и восстановлении локальных индексов из снимка. Оставить ограничения транзакционности YAML/XML-каталогов, потому что атомарность снимка не делает атомарной всю операцию.

Исторические документы в `docs/superpowers/specs` и `docs/superpowers/plans` не переписывать; они описывают принятые ранее решения.

- [ ] **Step 8: Проверить отсутствие старого договора**

Run:

```bash
rg -n \
  "ConfigurationIdentity|ConfigurationXmlNode|ConfigurationXmlValue|ComponentLogicalAddress|localIndexes|LOGICAL_ADDRESSES|XML_NODES|XML_VALUES|excludedEqualName|userSettingsId|setPresent|setAlias|setOrder" \
  packages/core/metadata .agents/architecture.md .agents/restrictions.md
```

Expected: нет совпадений, относящихся к снимку; допустимы только исторические слова в сообщениях тестов совместимости, если они проверяют отказ старого формата.

- [ ] **Step 9: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: PASS во всех `packages/*`.

- [ ] **Step 10: Проверить рабочее дерево и зафиксировать завершение**

Run:

```bash
git diff --check
git status --short
```

Expected: нет ошибок whitespace; перед финальным коммитом перечислены только
измеритель и активная документация этого задания.

```bash
git add packages/core/package.json \
  packages/core/scripts/measure-configuration-snapshot.mjs \
  packages/core/metadata/configurationIndex/measure.test.ts \
  .agents/architecture.md \
  .agents/restrictions.md \
  .agents/configuration-snapshot.md
git commit -m "docs: :memo: закрепить формат снимка конфигурации 1.3"
```

После коммита повторить `git status --short`; expected: пустой вывод.
