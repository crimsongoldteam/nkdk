# LMDB Configuration Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить монолитный `configuration-index.bin` компонентным LMDB-хранилищем, которое читает и публикует хэши и блоки отдельных проектных файлов без материализации полного снимка.

**Architecture:** `@nkdk/runtime` владеет `lmdb`, `BlockV1`, локальным reader и `ConfigurationIndexStore`; правила метаданных получают только descriptor хранилища, заранее вычисленные project paths и предметные операции. Import и full sync строят временный environment, partial prepare записывает дельту в `pendingHashes`/`pendingBlocks`, а finalize применяет её транзакционно после подтверждения 1С. Более поздний публичный договор `sync_to_infobase` сохраняется: `pending.json` остаётся только конвертом ZIP, migration и фаз доставки, но полного snapshot-кандидата в нём или рядом больше нет.

**Tech Stack:** TypeScript 7, Node.js 26, `lmdb` 3.5.x, Vitest 4, Piscina, XXH3-64, pnpm 10.

## Global Constraints

- Нормативная структура хранилища: `docs/superpowers/specs/2026-08-11-lmdb-configuration-index-design.md` и `.agents/configuration-snapshot.md`.
- Более поздний публичный цикл доставки: `docs/superpowers/specs/2026-08-12-partial-infobase-sync-design.md`; он сохраняет `pending.json` и восстановление фаз `transferring`/`applied`, но не сохраняет снимок-кандидат.
- Каждый компонент использует `.nkdk/components/<componentPath>/configuration-index.lmdb` с `noSubdir` и восстанавливаемым `configuration-index.lmdb-lock`.
- `overlappingSync: true` включается только на macOS/Linux; `noSync`, `noLock`, `useWritemap` не используются.
- Единственный писатель — координатор операции; worker открывают LMDB только для короткого чтения известных project paths.
- `BlockV1` содержит только `logicalAddress`, `uuid`, `xmlId`, `children`; XML-состояние, `xmlName`, generation и revision не переносятся.
- Старый `configuration-index.bin` не читается и не мигрируется; отсутствие LMDB требует повторного import.
- `hashes` содержит все проектные файлы, `blocks` — только непустые блоки YAML-файлов.
- `pendingHashes` и `pendingBlocks` независимы; tombstone физически кодируется отдельным маркером, отсутствие записи ничего не означает.
- Использованный импортированный или созданный UUID/XML-id всегда записывается в новый блок.
- Байтовое равенство поддержанного XML после `XML → YAML + LMDB → XML` остаётся обязательным.
- Существующие XML-фикстуры не изменяются.
- После каждого законченного слоя выполняется `pnpm duplicates -- --base origin/develop`.
- Перед завершением выполняются `pnpm type-check`, `pnpm test`, `pnpm test:e2e`, `pnpm test:architecture:rules`, `pnpm test:architecture` и packed smoke MCP.

---

## Карта файлов

### Новые файлы `@nkdk/runtime`

- `packages/runtime/metadata/configurationIndex/blockCodec.ts` — единственный двоичный codec `BlockV1`, hash и pending-значений.
- `packages/runtime/metadata/configurationIndex/blockCodec.test.ts` — границы, повреждения, детерминизм и полное потребление блока.
- `packages/runtime/metadata/configurationIndex/storePath.ts` — data/lock/tmp paths и descriptor без типов `lmdb`.
- `packages/runtime/metadata/configurationIndex/store.ts` — открытие environment, именованные базы, read-сессии, import/full publication и pending-транзакции.
- `packages/runtime/metadata/configurationIndex/store.test.ts` — точечные чтения, MVCC, полная замена, pending и файловое размещение.
- `packages/runtime/metadata/configurationIndex/localReader.ts` — предметный reader над заранее декодированными блоками.
- `packages/runtime/metadata/configurationIndex/localReader.test.ts` — поиск только в загруженных блоках без глобального fallback.
- `packages/rules/metadata/fullSyncToXml/configurationIndexSources.ts` — точный набор target/base project paths для задания.
- `packages/rules/metadata/fullSyncToXml/configurationIndexSources.test.ts` — владелец, корень, заимствованная форма и base component.
- `packages/rules/scripts/benchmark-configuration-index.mjs` — ручное измерение import-кандидата и partial-транзакций.

### Основные изменяемые области

- `packages/runtime/metadata/configurationIndex/{types,collector/writer,fragment,exportRuntime,referenceView}.ts` — тонкая модель блока и случайный operation seed.
- `packages/rules/metadata/commonObjects/{omittedChildren,childFormNames,childTemplateNames,childFileItemNames}/**` и `packages/rules/metadata/appliedObjects/configuration/configurationChildObjects.ts` — единый `children` и сохранение только невосстанавливаемого порядка.
- `packages/rules/metadata/importFromXml/**` — потоковая запись фрагментов во временную LMDB.
- `packages/rules/metadata/fullSyncToXml/**` — descriptor/source keys вместо `SharedArrayBuffer`, потоковый кандидат и транзакционная публикация.
- `packages/rules/metadata/partialSyncToXml/**` — pending-дельта LMDB вместо полного candidate-файла.
- `packages/rules/metadata/project/componentState/**` — подтверждённые hashes + descriptor вместо полного snapshot.
- `packages/runtime/metadataRuntime.ts`, `packages/rules/metadata/runtime/**`, `packages/mcp/src/{coreApi,contracts/services/syncToInfobase}*` — принудительная очистка и обновлённый публичный путь.
- `packages/mcp/{package.json,scripts/build.mjs,scripts/smoke-packed.mjs}`, `packages/runtime/package.json`, `pnpm-lock.yaml`, `.github/workflows/pr-quality.yml` — native dependency и поставка.

### Удаляемые после переключения файлы

- `packages/runtime/metadata/configurationIndex/{encode,decode,sharedSnapshot,stringPool}.ts` и их тесты.
- `packages/rules/metadata/fullSyncToXml/snapshotBuilder.ts` и `snapshotBuilder.test.ts`.
- `packages/rules/scripts/measure-configuration-snapshot.mjs`.
- Код `candidate-configuration-index.bin`, snapshot hash/generation и чтение старого `.bin` во всех операциях.

---

### Task 1: Зафиксировать `BlockV1` и двоичные значения таблиц

**Files:**
- Create: `packages/runtime/metadata/configurationIndex/blockCodec.ts`
- Create: `packages/runtime/metadata/configurationIndex/blockCodec.test.ts`
- Modify: `packages/runtime/metadata/configurationIndex/types.ts`
- Modify: `packages/runtime/index.ts`

**Interfaces:**
- Produces: `ConfigurationIndexBlock`, `ConfigurationIndexBlockEntity`, `ConfigurationIndexChild`.
- Produces: `encodeConfigurationIndexBlock(block): Uint8Array` and `decodeConfigurationIndexBlock(bytes): ConfigurationIndexBlock`.
- Produces: `encodeContentHash(bigint): Uint8Array`, `decodeContentHash(Uint8Array): bigint`.
- Produces: `encodePendingPut(Uint8Array): Uint8Array`, `encodePendingDelete(): Uint8Array`, `decodePendingValue(Uint8Array)`.

- [ ] **Step 1: Replace the persistent logical types with the thin block model**

```ts
export interface ConfigurationIndexChild {
  readonly xmlName: string
  readonly name: string
}

export interface ConfigurationIndexBlockEntity {
  readonly logicalAddress: string
  readonly uuid?: string
  readonly xmlId?: string
  readonly children?: readonly ConfigurationIndexChild[]
}

export interface ConfigurationIndexBlock {
  readonly entities: readonly ConfigurationIndexBlockEntity[]
}

export interface ConfigurationIndexBlockFragment {
  readonly targetProjectPath: string
  readonly entities: readonly ConfigurationIndexBlockEntity[]
}
```

Удалить из постоянной модели `specificationVersion`, `indexGeneration`, `componentPath`, `sourceProjectPath` внутри entity, `identities`, `xmlName`, `omittedChildren`, `xml` и все XML-флаги. `sourceProjectPath` остаётся только `targetProjectPath` транспортного фрагмента и ключом LMDB.

- [ ] **Step 2: Write failing codec tests**

Проверить таблицей:

```ts
it.each([
  { name: "uuid", entity: { logicalAddress: "Документ.Заказ", uuid: UUID } },
  { name: "xmlId", entity: { logicalAddress: "Форма.Элемент.Таблица", xmlId: "1" } },
  {
    name: "children",
    entity: {
      logicalAddress: "Конфигурация.Свойство.ДочерниеОбъекты",
      children: [{ xmlName: "Document", name: "Заказ" }],
    },
  },
])("round-trips $name", ({ entity }) => {
  expect(decodeConfigurationIndexBlock(encodeConfigurationIndexBlock({ entities: [entity] })))
    .toEqual({ entities: [entity] })
})
```

Добавить уникальные проверки: входной порядок entity не влияет на bytes; UUID кодируется 16 байтами; hash — ровно 8 байт LE; пустая entity/строка/children запрещена; повторы `logicalAddress` запрещены; оборванное поле, неизвестные flags, лишний байт и некорректный UTF-8 отклоняются.

- [ ] **Step 3: Run the codec tests to verify RED**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/blockCodec.test.ts
```

Expected: FAIL because `blockCodec.ts` and the thin types do not exist.

- [ ] **Step 4: Implement the exact binary layout**

Использовать layout без magic/version/length/checksum/string pool:

```text
u32 entityCount
repeat entityCount:
  utf8 logicalAddress = u32 byteLength + bytes
  u8 flags: uuid=1, xmlId=2, children=4
  uuid? = 16 raw bytes
  xmlId? = utf8
  children? = u32 count + repeat(utf8 xmlName + utf8 name)
```

Entity сортируются сравнением UTF-8 bytes. Decoder использует `TextDecoder("utf-8", { fatal: true })`, проверяет каждую границу, reserved flags, уникальность адресов и `offset === bytes.byteLength`. Pending layout: byte `0` — tombstone без payload; byte `1` — put, за которым идёт исходное hash/block value.

- [ ] **Step 5: Run codec and type checks**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/blockCodec.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS.

- [ ] **Step 6: Commit the codec layer**

```bash
git add packages/runtime/metadata/configurationIndex packages/runtime/index.ts
git commit -m "feat: :sparkles: добавить формат блока снимка LMDB"
```

---

### Task 2: Реализовать LMDB store и точечные read-сессии

**Files:**
- Create: `packages/runtime/metadata/configurationIndex/storePath.ts`
- Create: `packages/runtime/metadata/configurationIndex/store.ts`
- Create: `packages/runtime/metadata/configurationIndex/store.test.ts`
- Modify: `packages/runtime/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/runtime/index.ts`

**Interfaces:**
- Consumes: codec Task 1.
- Produces: `CONFIGURATION_INDEX_SCHEMA_VERSION = 1`.
- Produces: `ConfigurationIndexStoreDescriptor` with `dataPath`, `lockPath`, `schemaVersion`.
- Produces: `openConfigurationIndexStore(descriptor, mode: "readOnly" | "readWrite")` and `ConfigurationIndexStore`.
- Produces: short `readHashes()`, `getBlocks(projectPaths)` and `hasPending()` operations.

- [ ] **Step 1: Add `lmdb` only to runtime production dependencies**

```json
{
  "dependencies": {
    "lmdb": "^3.5.6"
  }
}
```

Run `pnpm install` to update `pnpm-lock.yaml`; do not add `lmdb` types to rules.

- [ ] **Step 2: Write path and store RED tests**

Tests must assert:

```ts
expect(configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })).toEqual({
  dataPath: join(projectDir, ".nkdk/components/cf/configuration-index.lmdb"),
  lockPath: join(projectDir, ".nkdk/components/cf/configuration-index.lmdb-lock"),
  schemaVersion: 1,
})
```

Also assert named DBs `meta`, `hashes`, `blocks`, `pendingHashes`, `pendingBlocks`; `meta/schemaVersion`; data+lock files; missing/unknown schema diagnostics include the absolute data path; a blockless hash is valid; a block without hash fails candidate validation.

- [ ] **Step 3: Run the store tests to verify RED**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/store.test.ts
```

Expected: FAIL because the store API is absent.

- [ ] **Step 4: Implement environment opening and ownership**

Open the root only as a named-DB catalog:

```ts
const root = open({
  path: descriptor.dataPath,
  noSubdir: true,
  encoding: "binary",
  overlappingSync: process.platform !== "win32",
})
const meta = root.openDB({ name: "meta", encoding: "binary" })
const hashes = root.openDB({ name: "hashes", encoding: "binary" })
const blocks = root.openDB({ name: "blocks", encoding: "binary" })
const pendingHashes = root.openDB({ name: "pendingHashes", encoding: "binary" })
const pendingBlocks = root.openDB({ name: "pendingBlocks", encoding: "binary" })
```

Все публичные ошибки открытия/загрузки оборачивать сообщением `Не удалось открыть снимок <dataPath>: ...`. Store отслеживает только собственные handle текущего процесса и закрывает их идемпотентно.

- [ ] **Step 5: Implement short read operations without block enumeration**

```ts
interface ConfigurationIndexStore {
  descriptor(): ConfigurationIndexStoreDescriptor
  readHashes(): readonly { projectPath: string; contentHash: bigint }[]
  getBlocks(projectPaths: readonly string[]): ReadonlyMap<string, ConfigurationIndexBlock>
  hasBlock(projectPath: string): boolean
  hasPending(): boolean
  flush(): Promise<void>
  close(): Promise<void>
}
```

`getBlocks` validates/normalizes every requested key and only calls `blocks.get` for unique requested keys. `readHashes` iterates only `hashes`; tests inject/spy at the database adapter boundary and prove that `blocks.getRange` is not called.

Ключ project path обязан быть непустой нормализованной UTF-8 строкой без `NUL`; перечисления наружу сортируются сравнением UTF-8 bytes, а не порядком LMDB. Проверить `""`, строку с `NUL`, обратные слеши, сегменты `.`/`..` и две строки с отличающимся Unicode-порядком.

- [ ] **Step 6: Verify read behavior and cleanup**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/store.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS and temporary environments close without open handles.

- [ ] **Step 7: Commit the store foundation**

```bash
git add packages/runtime/package.json pnpm-lock.yaml packages/runtime/metadata/configurationIndex packages/runtime/index.ts
git commit -m "feat: :sparkles: добавить хранилище снимка LMDB"
```

---

### Task 3: Добавить полную публикацию, pending-дельту и MVCC

**Files:**
- Modify: `packages/runtime/metadata/configurationIndex/store.ts`
- Modify: `packages/runtime/metadata/configurationIndex/store.test.ts`
- Modify: `packages/runtime/metadata/configurationIndex/storePath.ts`

**Interfaces:**
- Produces: temporary candidate lifecycle.
- Produces: `replaceActiveFrom(candidate)`, `writePending(delta)`, `applyPending()`, `clearPending()` and `pendingAlreadyApplied()`.
- Produces: `mergeBlockFragment(fragment)` for coordinator-only streaming writes.

Полный mutation-контракт этого слоя:

```ts
interface ConfigurationIndexCandidateStore extends ConfigurationIndexStore {
  mergeBlockFragment(fragment: ConfigurationIndexBlockFragment): void
  replaceHashes(files: readonly ConfigurationProjectFile[]): void
  copyActiveBlocksFrom(source: ConfigurationIndexStore, excludedProjectPaths: ReadonlySet<string>): void
  validateCandidate(): void
  discard(): Promise<void>
}

function createConfigurationIndexCandidateStore(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly operationId: string
  readonly purpose: "import" | "full" | "partial"
}): Promise<ConfigurationIndexCandidateStore>

interface ConfigurationIndexStore {
  replaceActiveFrom(candidate: ConfigurationIndexCandidateStore): Promise<void>
  publishImportedCandidate(candidate: ConfigurationIndexCandidateStore): Promise<void>
  writePending(delta: ConfigurationIndexPendingDelta): Promise<void>
  pendingAlreadyApplied(): boolean
  applyPending(): Promise<void>
  clearPending(): Promise<void>
}
```

`copyActiveBlocksFrom` переносит готовые encoded values без decode/re-encode; `validateCandidate` проверяет `blocks ⊆ hashes`. Все методы либо завершают собственную короткую read/write-сессию, либо явно принадлежат открытому candidate, который закрывает координатор.

Candidate размещается в `.nkdk/tmp/configuration-index/<purpose>/<componentPath>/<operationId>.lmdb`; `operationId` проходит проверку как один безопасный сегмент. `close()` не удаляет data автоматически, а `discard()` закрывает handle и удаляет только точные candidate data/lock paths, чтобы cleanup невозможно было направить на корень проекта.

- [ ] **Step 1: Write RED tests for full publication and pending semantics**

Cover independently:

- import publication closes owned sessions, removes candidate lock and atomically renames candidate data file;
- full publication clears/replaces active `hashes` and `blocks` in one transaction;
- reader opened before full publication keeps old values, a later reader sees all new values;
- `pendingHashes` and `pendingBlocks` accept disjoint keys;
- put/tombstone changes are invisible to active reads before `applyPending`;
- exception inside transaction changes neither active nor partial pending state;
- `applyPending` leaves pending intact; `clearPending` removes both named DB contents;
- any nonempty pending table blocks import/full/new prepare;
- `pendingAlreadyApplied` distinguishes initial and reapplied delta.

- [ ] **Step 2: Run the store tests to verify RED**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/store.test.ts
```

Expected: FAIL on the missing mutation API.

- [ ] **Step 3: Implement coordinator-only candidate writes**

```ts
interface ConfigurationIndexPendingDelta {
  readonly hashes: ReadonlyMap<string, { kind: "put"; contentHash: bigint } | { kind: "delete" }>
  readonly blocks: ReadonlyMap<string, { kind: "put"; block: ConfigurationIndexBlock } | { kind: "delete" }>
}
```

`mergeBlockFragment` reads and decodes only the current block for `targetProjectPath`, merges entities by `logicalAddress`, encodes outside a write callback, then performs one short put. Empty merged blocks delete the candidate block. Conflicts of the same address/field are errors.

- [ ] **Step 4: Implement explicit synchronous write transactions**

Before each transaction encode every value. Inside `transactionSync` only clear/put/remove already prepared bytes; no filesystem, XML, YAML, `await` or parsing. Await `root.flushed` before reporting success.

For full publication, synchronously iterate encoded candidate values inside the active transaction so the coordinator never builds a full JS array. For import file replacement, close owned active/candidate handles, remove recoverable lock files and rename only the candidate data file.

- [ ] **Step 5: Run store, type and duplicate checks**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/store.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS.

- [ ] **Step 6: Commit transactional publication**

```bash
git add packages/runtime/metadata/configurationIndex
git commit -m "feat: :sparkles: публиковать дельту снимка транзакцией LMDB"
```

---

### Task 4: Перевести collector и порядок детей на `BlockV1`

**Files:**
- Modify: `packages/runtime/metadata/configurationIndex/collector/writer.ts`
- Modify: `packages/runtime/metadata/configurationIndex/collector/writer.test.ts`
- Modify: `packages/runtime/metadata/configurationIndex/fragment.ts`
- Modify: `packages/runtime/metadata/configurationIndex/fragment.test.ts`
- Modify: `packages/runtime/metadata/configurationIndex/referenceView.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/commonObjects/omittedChildren.ts`
- Modify: `packages/rules/metadata/commonObjects/omittedChildren.test.ts`
- Modify: `packages/rules/metadata/commonObjects/childFormNames/{fromXML,toXML}.ts`
- Modify: `packages/rules/metadata/commonObjects/childTemplateNames/{fromXML,toXML}.ts`
- Modify: `packages/rules/metadata/commonObjects/childFileItemNames/{fromXML,toXML}.ts`
- Modify: `packages/rules/metadata/appliedObjects/configuration/configurationChildObjects.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.ts`
- Test: adjacent `*.test.ts` files and `packages/rules/metadata/configurationIndex/xmlStateInventory.test.ts`

**Interfaces:**
- Consumes: `ConfigurationIndexBlockEntity` and `ConfigurationIndexChild`.
- Produces: collector `setIdentity(address, "uuid" | "xmlId", value)` and `setChildren(address, children)`.
- Removes: collector XML state, `xmlName`, `OmittedChildren.kind` variants.

- [ ] **Step 1: Write RED inventory tests for the closed BlockV1 field set**

Assert every emitted entity has exactly this shape:

```ts
expect(Object.keys(entity).sort()).toEqual(
  ["children", "logicalAddress", "uuid", "xmlId"].filter((key) => key in entity).sort(),
)
```

Add regression cases proving `ExtendedConfigurationObject`, `InternalInfo` presence, `FillValue`, ordinary XML state and nonstandard `_name` never create BlockV1 fields. Existing YAML `!xml`/extension behavior remains the source of exact XML.

- [ ] **Step 2: Write RED canonical-order tests**

For `Form`, `Template`, `Table`, `Cube`, `DimensionTable` test:

- UTF-8-sorted input stores no `children`;
- noncanonical input stores the full `{ xmlName, name }[]` for that list;
- deletion preserves relative order of survivors;
- a new item goes to UTF-8 order without saved children, but to the end of a saved list;
- after merge reaches canonical order, the next block omits `children`.

For `Configuration/ChildObjects` test per-kind Russian `localeCompare(..., "ru")`, `STANDARD_CHILD_OBJECT_TYPE_ORDER`, partial per-kind storage and full flat fallback when XML kinds are interleaved.

- [ ] **Step 3: Run focused tests to verify RED**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/collector/writer.test.ts metadata/configurationIndex/fragment.test.ts
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/omittedChildren.test.ts metadata/commonObjects/childFormNames metadata/commonObjects/childTemplateNames metadata/commonObjects/childFileItemNames metadata/appliedObjects/configuration/configurationChildObjects.test.ts metadata/configurationIndex/xmlStateInventory.test.ts --no-isolate
```

Expected: FAIL because old variants and all-order persistence remain.

- [ ] **Step 4: Implement the thin collector and transport fragments**

`fragment(targetProjectPath)` returns entities without repeated source path. `encodeConfigurationIndexFragments` may remain a worker transport envelope, but its payload accepts only the thin entity fields and validates exact keys. `ConfigurationIndexFragmentBuilder` groups conflicts by `(targetProjectPath, logicalAddress)`, not globally by logical address.

- [ ] **Step 5: Implement canonical child-order helpers**

Expose explicit helpers:

```ts
canonicalNamedChildren(xmlName, names): ConfigurationIndexChild[]
mergeSavedChildren(current, saved, canonical): ConfigurationIndexChild[]
childrenToPersist(actual, canonical): ConfigurationIndexChild[] | undefined
```

Forms/templates/file items always repeat `xmlName`. Root configuration stores either changed kinds or the full flat root when kind order is noncanonical. Remove standard-attribute order collection because it is outside the closed list.

- [ ] **Step 6: Remove remaining snapshot reads/writes of XML state**

Delete `getConfigurationIndexPropertyXmlValue`, `getConfigurationIndexPropertyReferenceXMLValue`, `runtime.xml()`, `identity("xmlName")`, `setXmlFlag`, `setXmlValue`, `preserveRawXmlState` and all calls. Where extension code still consults `xml.extended`, derive the decision from the accepted extension YAML/property-state model and adopted-object index; do not add a replacement snapshot flag.

- [ ] **Step 7: Run rule and e2e regressions**

```bash
pnpm --filter @nkdk/runtime test
pnpm --filter @nkdk/rules test
pnpm test:e2e
pnpm duplicates -- --base origin/develop
```

Expected: PASS; exact XML remains unchanged.

- [ ] **Step 8: Commit thin BlockV1 collection**

```bash
git add packages/runtime/metadata packages/rules/metadata
git commit -m "refactor: :recycle: собирать только данные блока LMDB"
```

---

### Task 5: Ввести локальный reader и случайный operation seed

**Files:**
- Create: `packages/runtime/metadata/configurationIndex/localReader.ts`
- Create: `packages/runtime/metadata/configurationIndex/localReader.test.ts`
- Modify: `packages/runtime/metadata/configurationIndex/exportRuntime.ts`
- Modify: `packages/runtime/metadata/configurationIndex/exportRuntime.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseFormIndex.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/prepareAssignment.ts`

**Interfaces:**
- Consumes: decoded blocks from store.
- Produces: `createConfigurationIndexReader(blocksByProjectPath)` with no `snapshot`, `files()` or global fallback.
- Produces: `createConfigurationIndexExportRuntime({ operationSeed })`.

- [ ] **Step 1: Write RED tests for reader isolation**

```ts
const reader = createConfigurationIndexReader(new Map([
  ["А.yaml", { entities: [{ logicalAddress: "А", uuid: UUID_A }] }],
]))
expect(reader.entity("А")?.uuid).toBe(UUID_A)
expect(reader.entity("Б")).toBeUndefined()
expect([...reader.entities()]).toHaveLength(1)
```

Also reject the same `logicalAddress` in two loaded blocks. No API may enumerate blocks not passed to the reader.

- [ ] **Step 2: Write RED operation-seed tests**

Use two fixed 32-byte seeds and assert: same seed/address/kind produces the same UUID/XML-id/configVersion within an operation; another seed produces another value; an existing identity wins and is re-collected; no generation/header/snapshot bytes are read.

- [ ] **Step 3: Run focused tests to verify RED**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/localReader.test.ts metadata/configurationIndex/exportRuntime.test.ts
```

Expected: FAIL on missing local reader and old generation-derived seed.

- [ ] **Step 4: Implement the reader and seed contract**

```ts
createConfigurationIndexExportRuntime({
  source,
  collector,
  targetProjectPath,
  logicalAddress,
  operationSeed: Uint8Array,
})
```

Validate seed length once (32 bytes), copy it at the boundary and share it through every nested runtime. Keep deterministic derivation `SHA-256(seed, kind, logicalAddress)` and collection of every selected/generated identity.

- [ ] **Step 5: Simplify composite base-form readers**

`createBaseFormConfigurationIndexReader` combines only explicitly loaded target/base blocks. Remove fields tied to `snapshot`, `header`, file enumeration, `xmlName` and ordinary XML state; keep identity precedence and saved-base logical-address projection covered by existing tests.

- [ ] **Step 6: Verify runtime and form tests**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/configurationIndex/localReader.test.ts metadata/configurationIndex/exportRuntime.test.ts
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm --no-isolate
pnpm duplicates -- --base origin/develop
```

Expected: PASS.

- [ ] **Step 7: Commit local reads and seeds**

```bash
git add packages/runtime/metadata/configurationIndex packages/rules/metadata/forms packages/rules/metadata/fullSyncToXml/prepareAssignment.ts
git commit -m "refactor: :recycle: ограничить reader блоками задания"
```

---

### Task 6: Перевести import на потоковый временный LMDB

**Files:**
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/rules/metadata/importFromXml/binaryResult.ts`
- Modify: `packages/rules/metadata/importFromXml/binaryResult.test.ts`
- Modify: `packages/rules/metadata/projectState/service.test.ts`

**Interfaces:**
- Consumes: store candidate and `mergeBlockFragment`.
- Produces: import result path ending in `configuration-index.lmdb`.
- Removes: full `ConfigurationIndexFragmentBuilder` and `buildImportedConfigurationSnapshot` from coordinator.

- [ ] **Step 1: Write RED import tests**

Extend existing coordinator tests to prove:

- each streamed worker fragment is merged into only its candidate block before the next batch;
- coordinator never calls `finish()` returning a global entity array;
- YAML/external hashes are appended to `hashes` after actual writes;
- files without entity data have hashes but no blocks;
- block key without hash aborts publication;
- import failure removes candidate data/lock and preserves previously published LMDB;
- old `configuration-index.bin` is neither read nor decoded;
- successful import creates only `.lmdb` plus a recreatable lock.

- [ ] **Step 2: Run import tests to verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/importConfiguration.test.ts metadata/importFromXml/importConfigurationExtension.integration.test.ts --no-isolate
```

Expected: FAIL because import still builds/writes a monolithic snapshot.

- [ ] **Step 3: Stream fragments through the state sink**

Create the temporary store before workers. `XmlImportStateSink.writeFirstPassState` and `writeSecondPassState` decode one batch, then sequentially call `candidate.mergeBlockFragment(fragment)`. Preserve project-state fragment backpressure; do not retain decoded worker buffers.

- [ ] **Step 4: Finish candidate hashes and publish inside import finalization**

After all project files are written, call `candidate.replaceHashes(projectFiles)`, validate `blocks ⊆ hashes`, write `schemaVersion`, flush and close. Pass a callback to `importSession.finalize` that atomically publishes candidate data at the active path. On cleanup aggregate pool/session/store failures without masking the primary error.

- [ ] **Step 5: Verify import and exact round-trip**

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml --no-isolate
pnpm test:e2e
pnpm duplicates -- --base origin/develop
```

Expected: PASS and e2e produces LMDB only from the current import.

- [ ] **Step 6: Commit LMDB import**

```bash
git add packages/rules/metadata/importFromXml packages/rules/metadata/projectState
git commit -m "feat: :sparkles: записывать import напрямую в LMDB"
```

---

### Task 7: Вычислять source keys и читать LMDB в worker

**Files:**
- Create: `packages/rules/metadata/fullSyncToXml/configurationIndexSources.ts`
- Create: `packages/rules/metadata/fullSyncToXml/configurationIndexSources.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/types.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/componentRuntime.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/componentProfile.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configuration.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/workerPool.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/workerPool.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/project/componentState/{types,confirm}.ts`

**Interfaces:**
- Consumes: `ConfigurationIndexStoreDescriptor`, active hash list and local reader.
- Produces: `FullXmlSyncExecutionAssignment.configurationIndexSources` split into target/base project paths.
- Removes: `SharedConfigurationIndexSnapshot`, entity ranges and assignment global fallback.

- [ ] **Step 1: Write RED source-key planner tests**

Expected shape:

```ts
{
  targetProjectPaths: [assignment.sourceProjectPath, ownerProjectPath, savedBaseFormPath].sort(compareUtf8),
  baseProjectPaths: [baseFormProjectPath].sort(compareUtf8),
}
```

Test root assignment, ordinary owner, form/template owner, borrowed form with saved representation and extension assignment needing base identities. Duplicate paths are removed; unknown required owner path is a planning error.

- [ ] **Step 2: Write RED worker integration tests**

Use a real temporary LMDB with an unrelated corrupt block. Execute an assignment requesting one good path and assert success: the corrupt unrelated block is never read. Then omit a required owner/base path and assert the planner/worker contract test fails instead of falling back to enumeration.

- [ ] **Step 3: Run focused tests to verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/fullSyncToXml/configurationIndexSources.test.ts metadata/fullSyncToXml/workerPool.test.ts --no-isolate
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml/worker.integration.test.ts --no-isolate
```

Expected: FAIL because worker still receives a full shared snapshot.

- [ ] **Step 4: Change confirmed component state**

```ts
interface ConfirmedComponentState {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly indexes: ComponentIndexes
  readonly snapshot: {
    readonly descriptor: ConfigurationIndexStoreDescriptor
    readonly projectFiles: readonly ConfigurationProjectFile[]
  }
  readonly projectStateReadToken: ProjectStateReadToken
}
```

`readProfileComponentStates` opens a short coordinator read-session, verifies schema, reads only active hashes and closes it. Profile confirmation uses `snapshot.projectFiles`; target/base blocks needed for adopted UUID calculation are fetched by project path obtained from `indexes.logicalAddresses`.

- [ ] **Step 5: Change worker initialization and execution**

Initialization receives target/base descriptors and the common 32-byte operation seed. Each batch groups requested paths, opens short target/base read-sessions, loads only those blocks, closes sessions, then creates per-assignment local readers. Remove `configurationIndexEntityRange`, lookup statistics and all `SharedArrayBuffer` snapshot transfer.

- [ ] **Step 6: Verify workers, extensions and borrowed forms**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/fullSyncToXml metadata/project/componentState --no-isolate
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml --no-isolate
pnpm duplicates -- --base origin/develop
```

Expected: PASS; extensions read only their own and explicitly required base blocks.

- [ ] **Step 7: Commit source-scoped workers**

```bash
git add packages/rules/metadata/fullSyncToXml packages/rules/metadata/project/componentState
git commit -m "refactor: :recycle: читать снимок по ключам задания"
```

---

### Task 8: Публиковать full sync через временный LMDB-кандидат

**Files:**
- Modify: `packages/rules/metadata/fullSyncToXml/binaryResult.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/binaryResult.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/workerPool.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/failureIntegration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/types.ts`

**Interfaces:**
- Consumes: candidate store and source-scoped worker batches.
- Produces: `FullXmlSyncExecutionBatch.configurationFragments` under existing backpressure.
- Removes: returned global `fragmentData` and `buildXmlSyncConfigurationSnapshot`.

- [ ] **Step 1: Write RED full-sync transaction tests**

Assert:

- fragment buffers are consumed in `onBatch` before worker proceeds;
- full sync starts candidate with current hashes and active blocks for unprocessed paths;
- processed source paths replace/delete their candidate blocks;
- failure in XML write/validation leaves active hashes/blocks unchanged;
- success publishes all candidate keys in one active transaction;
- reader started before publication sees the old state;
- pending state blocks full sync;
- common operation seed is identical in every worker.

- [ ] **Step 2: Run full-sync tests to verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/fullSyncToXml/syncConfiguration.test.ts metadata/fullSyncToXml/workerPool.test.ts --no-isolate
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml/failureIntegration.test.ts --no-isolate
```

Expected: FAIL because the coordinator still builds a full JS snapshot and writes `.bin`.

- [ ] **Step 3: Stream worker fragments into candidate**

Extend `onBatch`:

```ts
interface FullXmlSyncExecutionBatch {
  readonly generatedDocuments: readonly FullXmlSyncGeneratedDocument[]
  readonly configurationFragments: readonly ConfigurationIndexBlockFragment[]
}
```

Full sync creates a temporary store, copies active encoded blocks needed for unprocessed paths, writes all current hashes, then merges each returned fragment. The worker pool no longer merges all fragment buffers after completion.

- [ ] **Step 4: Publish only after XML verification**

After external transfer and `validateWrittenFiles`, validate candidate and call `active.replaceActiveFrom(candidate)`. Flush, close and remove candidate environment. On every failure close worker/read/store handles and remove only the candidate; keep active state.

- [ ] **Step 5: Verify full sync and e2e**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/fullSyncToXml --no-isolate
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml --no-isolate
pnpm test:e2e
pnpm duplicates -- --base origin/develop
```

Expected: PASS and exact XML equality remains green.

- [ ] **Step 6: Commit full-sync publication**

```bash
git add packages/rules/metadata/fullSyncToXml
git commit -m "feat: :sparkles: публиковать full sync через LMDB"
```

---

### Task 9: Записывать partial prepare как LMDB-дельту

**Files:**
- Modify: `packages/rules/metadata/partialSyncToXml/changeDetector.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/impactPlanner.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/pendingStore.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/pendingStore.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/types.ts`

**Interfaces:**
- Consumes: active `hashes`, candidate block fragments and store `writePending`.
- Produces: pending JSON version 3 without snapshot candidate/hash/generation.
- Produces: exact independent `pendingHashes`/`pendingBlocks` maps.

- [ ] **Step 1: Write RED change/impact tests**

Cover:

- change detection reads active hashes only;
- adding/deleting/renaming a top-level object selects `Конфигурация.yaml` owner block;
- form/template changes select owner properties YAML;
- dimension-table changes select cube owner YAML;
- unchanged owner has `pendingBlocks` but no `pendingHashes`;
- removed project file gets hash tombstone and block tombstone only if active block existed;
- processed YAML with no new entities gets a block tombstone;
- BSL/binary changes create hash delta without block;
- pending migration with empty file delta is an error.
- rename through migration reads UUID/XML-id by the previous logical address, writes them under the new address and does not carry the old child position;
- manual rename without migration removes the old entry, generates new identities and appends the new child according to the saved/canonical list rule.

- [ ] **Step 2: Run partial prepare tests to verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/partialSyncToXml/changeDetector.test.ts metadata/partialSyncToXml/impactPlanner.test.ts metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts metadata/partialSyncToXml/pendingStore.test.ts --no-isolate
```

Expected: FAIL because prepare still encodes a complete candidate.

- [ ] **Step 3: Replace candidate snapshot construction**

Prepare creates a temporary delta store or per-path encoded block accumulator and consumes worker fragments through `onBatch`. After ZIP close and composition/hash validation, build:

```ts
const delta: ConfigurationIndexPendingDelta = {
  hashes: changedProjectFilesOnly,
  blocks: rebuiltAndDeletedBlocks,
}
```

One active LMDB transaction rechecks both pending DBs empty and writes both maps. Active hashes/blocks are never modified during prepare.

- [ ] **Step 4: Reduce `pending.json` to delivery metadata**

Version 3 keeps exactly `packageId`, `componentPath`, `archiveProjectPath`, `archiveHash`, `candidateAppliedMigrations`, `entries`, `loadTargets`, `delivery`. Remove `sourceSnapshotHash`, `sourceSnapshotGeneration`, `candidateSnapshotHash`, `baseSnapshotHash`, `baseSnapshotGeneration` and `candidate-configuration-index.bin` path/bytes.

Write order: close+verify ZIP, write LMDB pending transaction, then atomically write pending JSON. If JSON write fails, pending remains and the next operation requires explicit force clear; it is never silently removed.

- [ ] **Step 5: Stop auto-cleaning previous pending state**

`preparePartialXmlSyncPackage` must return a specific diagnostic when either LMDB pending table or pending JSON is nonempty. It may clean only temporary files created before its own pending transaction; it must not delete a previous package automatically.

- [ ] **Step 6: Verify partial prepare and byte-equivalent XML**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/partialSyncToXml --no-isolate
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/partialSyncToXml --no-isolate
pnpm test:e2e
pnpm duplicates -- --base origin/develop
```

Expected: PASS; partial package XML equals full sync for the same project state.

- [ ] **Step 7: Commit partial delta preparation**

```bash
git add packages/rules/metadata/partialSyncToXml
git commit -m "feat: :sparkles: готовить partial sync как LMDB-дельту"
```

---

### Task 10: Финализировать pending и добавить явную принудительную очистку

**Files:**
- Modify: `packages/rules/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/deliveryState.ts`
- Modify: `packages/runtime/metadataRuntime.ts`
- Modify: `packages/rules/metadata/runtime/contracts.ts`
- Modify: `packages/rules/metadata/runtime/createMetadataRuntime.ts`
- Modify: `packages/mcp/src/contracts/syncToInfobase.ts`
- Modify: `packages/mcp/src/contracts/syncToInfobase.test.ts`
- Modify: `packages/mcp/src/services/syncToInfobase.ts`
- Modify: `packages/mcp/src/services/syncToInfobase.test.ts`
- Modify: `packages/mcp/src/services/syncToInfobase.integration.test.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/coreApi.test.ts`

**Interfaces:**
- Consumes: `applyPending`, `pendingAlreadyApplied`, `clearPending`.
- Produces: `forceClearPending?: boolean` on the existing public tool.
- Preserves: delivery phases and recovery of `applied` package.

- [ ] **Step 1: Write RED finalize ordering tests**

Assert exact order:

```text
verify applied delivery + ZIP hash
apply pending to active, leave pending
publish applied-migrations.yaml
clear both pending DBs
remove pending.json and ZIP
```

Test transaction failure, migration publication failure, pending-clear failure and ZIP deletion warning independently. A retry after active apply returns `alreadyPublished` using `pendingAlreadyApplied` and completes migration/cleanup without generation/hash fields.

- [ ] **Step 2: Write RED force-clear public-contract tests**

`forceClearPending: true` requires `allowWrite: true`, clears both LMDB pending DBs plus pending JSON/ZIP, does not alter active hashes/blocks and then starts a fresh prepare. Without the flag, any stale pending state returns a diagnostic instructing the user to repeat explicitly with the flag.

- [ ] **Step 3: Run core and MCP tests to verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/partialSyncToXml/finalizePartialXmlSyncPackage.test.ts metadata/partialSyncToXml/deliveryState.test.ts --no-isolate
pnpm --filter @nkdk/mcp exec vitest run src/contracts/syncToInfobase.test.ts src/services/syncToInfobase.test.ts
```

Expected: FAIL because finalize writes the candidate file and the flag is absent.

- [ ] **Step 4: Implement idempotent finalize**

Finalize reads pending JSON only for package/delivery/archive/migrations metadata. It verifies `delivery.status === "applied"`, package id and current ZIP XXH3. Then it calls `pendingAlreadyApplied` for the response status, applies pending transactionally, publishes migrations, clears pending and deletes transport files.

- [ ] **Step 5: Implement force clear through runtime and MCP**

Expose one internal operation `clearPending({ projectDir, componentPath, force: true })`. MCP passes the explicit input before prepare; no separate public tool is added. Cleanup diagnostics state that already-applied configuration and `applied-migrations.yaml` are not reconciled automatically.

- [ ] **Step 6: Verify the complete infobase cycle**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/partialSyncToXml --no-isolate
pnpm --filter @nkdk/mcp test
pnpm duplicates -- --base origin/develop
```

Expected: PASS for fresh delivery, rejection back to prepared, unknown outcome, applied recovery, finalize retry and force clear.

- [ ] **Step 7: Commit finalize and recovery**

```bash
git add packages/rules/metadata/partialSyncToXml packages/rules/metadata/runtime packages/runtime/metadataRuntime.ts packages/mcp/src
git commit -m "feat: :sparkles: финализировать pending LMDB после загрузки 1С"
```

---

### Task 11: Удалить монолитный codec и обновить все публичные пути

**Files:**
- Delete: `packages/runtime/metadata/configurationIndex/encode.ts`
- Delete: `packages/runtime/metadata/configurationIndex/encode.test.ts`
- Delete: `packages/runtime/metadata/configurationIndex/decode.ts`
- Delete: `packages/runtime/metadata/configurationIndex/decode.test.ts`
- Delete: `packages/runtime/metadata/configurationIndex/sharedSnapshot.ts`
- Delete: `packages/runtime/metadata/configurationIndex/sharedSnapshot.test.ts`
- Delete: `packages/runtime/metadata/configurationIndex/stringPool.ts`
- Delete: `packages/runtime/metadata/configurationIndex/stringPool.test.ts`
- Delete: `packages/rules/metadata/fullSyncToXml/snapshotBuilder.ts`
- Delete: `packages/rules/metadata/fullSyncToXml/snapshotBuilder.test.ts`
- Delete: `packages/rules/scripts/measure-configuration-snapshot.mjs`
- Modify: `packages/runtime/index.ts`
- Modify: `packages/rules/metadata/configurationIndex/index.ts`
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: `packages/mcp/src/services/{importFromXml,syncToXml,syncToInfobase}*.ts`
- Modify: `packages/rules/metadata/projectState/service.test.ts`
- Modify: `.agents/restrictions.md`

**Interfaces:**
- Removes: every export/reference to `ConfigurationSnapshot`, `SharedConfigurationIndexSnapshot`, old encode/decode/file IO and `.bin`.
- Keeps: result field `configurationIndexPath`, now pointing to `.lmdb` data file.

- [ ] **Step 1: Add a failing absence audit**

Run and preserve expected-empty searches in the task report:

```bash
rg -n "configuration-index\.bin|candidate-configuration-index\.bin|SharedConfigurationIndexSnapshot|ConfigurationSnapshot|encodeConfigurationIndex|decodeConfigurationIndex|indexGeneration" packages e2e
```

Expected before cleanup: matches remain.

- [ ] **Step 2: Delete old codec and adapt all tests/test helpers**

Replace test snapshots with temporary LMDB fixture helpers that insert hashes/blocks through `ConfigurationIndexStore`. Do not keep a compatibility decoder. Update result assertions and guides to `configuration-index.lmdb`; lock-file assertions treat it as recreatable service state.

- [ ] **Step 3: Update restrictions, not architecture**

Remove restrictions that describe direct non-atomic `.bin` writes or candidate files. Record the remaining limitation: LMDB and YAML/project-state are not one filesystem transaction. Do not edit `.agents/architecture.md`; it already describes the agreed LMDB target, and any new mismatch must be reported rather than silently rewritten.

- [ ] **Step 4: Verify no legacy symbols remain**

```bash
test -z "$(rg -l 'configuration-index\.bin|candidate-configuration-index\.bin|SharedConfigurationIndexSnapshot|encodeConfigurationIndex|decodeConfigurationIndex|indexGeneration' packages e2e)"
pnpm type-check
pnpm test
pnpm duplicates -- --base origin/develop
```

Expected: all PASS and search is empty.

- [ ] **Step 5: Commit legacy removal**

```bash
git add -A packages .agents/restrictions.md e2e
git commit -m "refactor: :fire: удалить монолитный снимок конфигурации"
```

---

### Task 12: Проверить native-поставку, benchmark и полный round-trip

**Files:**
- Modify: `packages/mcp/package.json`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `packages/mcp/scripts/smoke-packed.mjs`
- Modify: `.github/workflows/pr-quality.yml`
- Create: `packages/rules/scripts/benchmark-configuration-index.mjs`
- Modify: `packages/rules/package.json`
- Modify: `e2e/fixture-layout.test.ts`
- Modify: `e2e/metadata-project.test.ts`

**Interfaces:**
- Produces: installed packed MCP with working LMDB native module.
- Produces: manual `benchmark:configuration-index -- <xmlDir> <projectDir>` without CI thresholds.
- Verifies: no generated snapshot is committed and round-trip XML is byte-identical.

- [ ] **Step 1: Write packed-smoke LMDB behavior before changing packaging**

Inside the installed tarball process, create a temporary store, write one hash and one block, close/reopen, read exact values and delete the temp project. This must run through code loaded by the packed MCP, not the source workspace.

- [ ] **Step 2: Run packed smoke to verify RED**

```bash
pnpm --filter @nkdk/mcp smoke:packed
```

Expected: FAIL because `lmdb` is not an MCP runtime dependency/external.

- [ ] **Step 3: Ship the native dependency**

Add `lmdb` to `packages/mcp.dependencies` and `packages/mcp/scripts/build.mjs` `external`. Keep it in runtime dependencies for source packages. Extend CI with an LMDB smoke matrix for `ubuntu-latest`, `macos-latest`, `windows-latest`; each job installs with the locked pnpm version and runs the focused runtime store test plus packed smoke.

- [ ] **Step 4: Add the manual benchmark**

The script accepts an XML component and empty project directory, runs normal import once, reports import wall time/data bytes/block count, then performs measured pending+apply+clear cycles for 1, 10 and 10% of block keys. It prints JSON and human-readable medians; it never enforces duration/size thresholds and never writes into the source XML catalog.

Run manually:

```bash
pnpm --filter @nkdk/rules benchmark:configuration-index -- /Users/nikita/git/sed_xml/cf /private/tmp/nkdk-lmdb-benchmark
```

- [ ] **Step 5: Strengthen e2e generated-state assertions**

Assert the committed `e2e/fixtures/nkdk` has no `.nkdk`. During each e2e import assert temporary components contain `.lmdb`; export must use that same imported project; compare all XML files byte-for-byte and do not copy/reference an expected snapshot.

- [ ] **Step 6: Run final verification from repository root**

```bash
pnpm type-check
pnpm test
pnpm test:e2e
pnpm test:architecture:rules
pnpm test:architecture
pnpm --filter @nkdk/mcp smoke:packed
pnpm duplicates -- --base origin/develop
git diff --check
```

Expected: every command PASS; no XML fixture or generated `.nkdk` file appears in `git status`.

- [ ] **Step 7: Review the plan contracts against the implementation**

Verify explicitly in the completion report:

- no full snapshot buffer/array is built in import/full/partial;
- worker request only known target/base paths;
- active partial state changes only in finalize;
- every generated ID is present in the resulting block;
- only the six approved child-list groups can create `children`;
- stale pending requires explicit force clear;
- old `.bin` is ignored;
- exact e2e XML is byte-identical.

- [ ] **Step 8: Commit packaging and verification**

```bash
git add packages/mcp packages/rules/package.json packages/rules/scripts .github/workflows/pr-quality.yml e2e pnpm-lock.yaml
git commit -m "test: :white_check_mark: проверить поставку и round-trip LMDB"
```

---

## Порядок ревью и исполнения

1. Tasks 1–3 образуют самостоятельный runtime-слой и проходят ревью до изменения metadata-операций.
2. Tasks 4–5 закрывают предметную модель `BlockV1`; до их зелёного e2e нельзя переключать import.
3. Tasks 6–8 по очереди переключают import, чтение worker и full publication.
4. Tasks 9–10 переключают partial prepare/finalize, сохраняя поздний публичный договор доставки.
5. Tasks 11–12 удаляют совместимость, проверяют поставку и весь проект.

После каждого task исполнитель показывает diff и результаты указанных проверок. При расхождении `.agents/architecture.md` с фактической реализацией выполнение останавливается и расхождение сообщается разработчику; архитектурный файл без отдельного разрешения не меняется.
