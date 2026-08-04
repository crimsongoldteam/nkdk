# Full Sync Shared Lookup Indexes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить квадратичный обход композиции и отдельные полные `Map` configuration index в каждом full-sync worker, переиспользовав один неизменяемый двоичный hash-index в общей памяти.

**Architecture:** Сначала существующий project-state hash-index переносится в нейтральный `metadata/binary` без изменения 16-байтового формата. Затем full sync получает индекс владельцев и предметный запрос `children(ownerLogicalAddress)`, а configuration index — четыре неперсистентных lookup-структуры, построенные главным процессом один раз и разделяемые всеми worker. Дисковые форматы project state и configuration index `1.3`, XML/YAML-семантика и обязательный `refreshAndValidate` остаются прежними.

**Tech Stack:** TypeScript 7, Vitest 4, `SharedArrayBuffer`, `structurae`, `@node-rs/xxhash`, Piscina, jscpd (`pnpm check:duplicates`), dependency-cruiser (`pnpm test:architecture`).

## Global Constraints

- Базовый коммит для проверки новых дублей: `3c9281164`.
- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять правила fromXML/toXML/fromYAML/toYAML и не изменять `rules.ts`.
- Не добавлять `!xml`.
- Не менять configuration index `1.3`, версию и байты project state.
- Не отключать и не упрощать `refreshAndValidate`; не менять `concurrency: 4`.
- `metadata/orchestration`, `metadata/validation` и `metadata/project` не должны знать частные `itemType`, имена XML-корней и папки прикладных объектов.
- Hash-index подтверждает исходный ключ после совпадения хэша; полного `Map` или линейного fallback в production-поиске нет.
- Заполнение hash-index не превышает 80%; повреждённые заголовки, границы, `recordId` и диапазоны дают техническую ошибку.
- Порядок детей и entity совпадает с текущим предметным порядком, а не с порядком hash-слотов.
- После каждого законченного слоя и в финале выполнить обязательный по `AGENTS.md` `pnpm check:duplicates -- --base 3c9281164`; dependency-cruiser выполнить один раз в финале после всех изменений импортов и структуры.
- `.dependency-cruiser.mjs` и `tools/dependency-cruiser` не менять; поэтому `pnpm test:architecture:rules` не нужен.
- Спецификация решения: `docs/superpowers/specs/2026-08-04-full-sync-shared-lookup-indexes-design.md`.

## File map

- Create `packages/core/metadata/binary/hashIndex.ts`: нейтральная 16-байтовая ячейка, построение, открытие с проверкой, поиск и обход.
- Create `packages/core/metadata/binary/hashIndex.test.ts`: самостоятельный договор общего индекса, коллизии, заполнение, повреждения и точные байты.
- Delete `packages/core/metadata/projectState/binary/hashIndex.ts`: предметная копия алгоритма больше не нужна.
- Modify `packages/core/metadata/projectState/binary/layouts.ts`: удалить `ProjectStateHashSlotRecordView`, не затрагивая остальные project-state layouts.
- Modify `packages/core/metadata/projectState/binary/{typedBuilder,stringPool,snapshot}.ts`: импортировать общий индекс и `BinaryHashSlotRecordView`.
- Modify `packages/core/metadata/projectState/binary/{hashIndex.test,builder.test,persistence.test}.ts`: перенести общий договор, сохранить проверки заполнения и побайтовой совместимости project state.
- Modify `packages/core/metadata/fullSyncToXml/sharedMetadata.ts`: добавить таблицу детей, диапазоны владельцев, owner hash-index и raw-проход для `itemTypeByYamlDir`.
- Modify `packages/core/metadata/fullSyncToXml/sharedMetadata.test.ts`: проверить shared-буферы, коллизии владельцев, порядок, отсутствие владельца и каталог типов.
- Modify `packages/core/metadata/resourceTopology/capabilities.ts`: заменить массив композиции предметным интерфейсом `MetadataXmlPrepareComposition`.
- Modify `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`: запрашивать детей только текущего владельца.
- Modify `packages/core/metadata/orchestration/appliedObject/syncPreparedToXML.test.ts`: проверить один предметный запрос без полного обхода.
- Modify `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`: передавать capability индексированную композицию без `map` всего снимка.
- Modify `packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts`: подтвердить структурный договор новой capability.
- Modify `packages/core/metadata/fullSyncToXml/worker.ts`: построить `itemTypeByYamlDir` при initialize и переиспользовать между пачками.
- Modify `packages/core/metadata/fullSyncToXml/worker.test.ts`: проверить единственное построение каталога типов и отсутствие накопления состояния.
- Modify `packages/core/metadata/configurationIndex/sharedSnapshot.ts`: построить и открыть общие индексы строк, файлов, entity и диапазонов source path; удалить четыре полных локальных `Map`.
- Modify `packages/core/metadata/configurationIndex/sharedSnapshot.test.ts`: проверить совместное использование, поиск, коллизии, границы и неизменность encoded `1.3`.
- Modify `packages/core/metadata/configurationIndex/encode.test.ts`: оставить существующую эталонную проверку кодирования `1.3` и усилить её сравнением до/после reader-пути, если ближайший тест ещё не фиксирует байты.
- Modify `packages/core/metadata/projectState/binary/architecture.test.ts`: зафиксировать отсутствие старого предметного hash-index и полных composition/configuration `Map` в рабочих путях.

---

### Task 1: Neutral immutable binary hash-index

**Files:**
- Create: `packages/core/metadata/binary/hashIndex.ts`
- Create: `packages/core/metadata/binary/hashIndex.test.ts`
- Delete: `packages/core/metadata/projectState/binary/hashIndex.ts`
- Delete: `packages/core/metadata/projectState/binary/hashIndex.test.ts`
- Modify: `packages/core/metadata/projectState/binary/layouts.ts`
- Modify: `packages/core/metadata/projectState/binary/typedBuilder.ts`
- Modify: `packages/core/metadata/projectState/binary/stringPool.ts`
- Modify: `packages/core/metadata/projectState/binary/snapshot.ts`
- Modify: `packages/core/metadata/projectState/binary/builder.test.ts`
- Modify: `packages/core/metadata/projectState/binary/persistence.test.ts`

**Interfaces:**
- Consumes: `structurae.View`, готовые `BigUint64Array` хэшей и `Uint32Array` идентификаторов записей.
- Produces:

```ts
export interface BinaryHashIndex {
  readonly slots: ArrayBufferLike
  readonly byteOffset?: number
  readonly size: number
  readonly capacity: number
}

export const BinaryHashSlotRecordView: {
  readonly viewLength: 16
  encode(value: BinaryHashSlotRecord, view: DataView, offset?: number): void
  decode(view: DataView, offset?: number): BinaryHashSlotRecord
}

export function buildBinaryHashIndex(
  hashes: BigUint64Array,
  recordIds: Uint32Array,
): BinaryHashIndex

export function openBinaryHashIndex(index: BinaryHashIndex): BinaryHashIndex

export function findBinaryHashIndex(
  index: BinaryHashIndex,
  hash: bigint,
  keyEquals: (recordId: number) => boolean,
): number | undefined

export function forEachBinaryHashIndexEntry(
  index: BinaryHashIndex,
  visit: (hash: bigint, recordId: number) => void,
): void
```

- `openBinaryHashIndex` принимает только целые `size/capacity`, степень двойки `capacity >= 1`, `size <= capacity`, `size / capacity <= 0.8`, неотрицательный `byteOffset` и полностью помещающиеся `capacity * 16` байт. Выравнивание смещения не требуется: существующий project-state формат содержит допустимые невыровненные встроенные таблицы.
- `findBinaryHashIndex` вызывает `keyEquals` только при совпавшем 64-битовом хэше и отвергает занятый слот с `recordId > 0xffffffff` как повреждённый.

- [ ] **Step 1: Write the failing neutral-index tests**

Перенести два существующих теста из `projectState/binary/hashIndex.test.ts` и дополнить их самостоятельными границами:

```ts
it("кодирует прежнюю 16-байтовую ячейку побайтно", () => {
  const index = buildBinaryHashIndex(new BigUint64Array([0x0102030405060708n]), new Uint32Array([0x0a0b0c0d]))
  const occupied = Array.from(new Uint8Array(index.slots)).findIndex((_, slot) =>
    BinaryHashSlotRecordView.decode(new DataView(index.slots), slot * 16).occupied === 1
  )
  expect(Array.from(new Uint8Array(index.slots, occupied * 16, 16))).toEqual([
    0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01,
    0x0d, 0x0c, 0x0b, 0x0a, 0x01, 0x00, 0x00, 0x00,
  ])
})

it("отвергает несовпадающие входы и повреждённые границы", () => {
  expect(() => buildBinaryHashIndex(new BigUint64Array([1n]), new Uint32Array())).toThrow(/совпад/iu)
  expect(() => openBinaryHashIndex({ slots: new SharedArrayBuffer(16), size: 2, capacity: 1 })).toThrow()
  expect(() => openBinaryHashIndex({ slots: new SharedArrayBuffer(16), byteOffset: 8, size: 0, capacity: 1 })).toThrow()
  expect(() => openBinaryHashIndex({ slots: new SharedArrayBuffer(16), size: 1, capacity: 3 })).toThrow()
})
```

Для коллизии оставить готовый договор: два одинаковых хэша, `keyEquals` выбирает запись `9`; при всегда ложном callback результат `undefined`. Для 81 записей оставить проверку `size / capacity <= 0.8`.

- [ ] **Step 2: Run the new test and verify the neutral module is missing**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/binary/hashIndex.test.ts
```

Expected: FAIL из-за отсутствующего `metadata/binary/hashIndex.ts` или его экспортов.

- [ ] **Step 3: Move the slot layout and implement validation/build/search**

В `metadata/binary/hashIndex.ts` создать собственный `new View()` и перенести layout без изменения порядка:

```ts
interface BinaryHashSlotRecord {
  readonly hash: bigint
  readonly recordId: number
  readonly occupied: number
  readonly reserved8: number
  readonly reserved16: number
}

export const BinaryHashSlotRecordView = new View().create<BinaryHashSlotRecord>({
  $id: "BinaryHashSlotRecord",
  type: "object",
  properties: {
    hash: { type: "number", btype: "biguint64" },
    recordId: { type: "integer", btype: "uint32" },
    occupied: { type: "integer", btype: "uint8" },
    reserved8: { type: "integer", btype: "uint8" },
    reserved16: { type: "integer", btype: "uint16" },
  },
})
```

Скопировать существующий алгоритм линейного пробирования, вызвать `openBinaryHashIndex` в начале `findBinaryHashIndex` и `forEachBinaryHashIndexEntry`, а из `projectState/binary/layouts.ts` удалить только `ProjectStateHashSlotRecord` и `ProjectStateHashSlotRecordView`.

- [ ] **Step 4: Migrate project state to the neutral module**

Во всех трёх потребителях заменить импорты:

```ts
import {
  BinaryHashSlotRecordView,
  buildBinaryHashIndex,
  findBinaryHashIndex,
  forEachBinaryHashIndexEntry,
  openBinaryHashIndex,
  type BinaryHashIndex,
} from "../../binary/hashIndex"
```

В `ProjectStateSnapshotView` после существующей проверки offsets/length открывать оба встроенных среза через `openBinaryHashIndex`. В `typedBuilder.ts` и `stringPool.ts` заменить `ProjectStateHashSlotRecordView.viewLength` на `BinaryHashSlotRecordView.viewLength`; иных байтов не менять.

- [ ] **Step 5: Run targeted compatibility tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/binary/hashIndex.test.ts \
  metadata/projectState/binary/builder.test.ts \
  metadata/projectState/binary/stringPool.test.ts \
  metadata/projectState/binary/persistence.test.ts
```

Expected: PASS; `hashIndexStats().loadFactor` остаётся не выше `0.8`, сохранённый project state загружается обратно.

- [ ] **Step 6: Verify types and duplicates for layer 1**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm check:duplicates -- --base 3c9281164
```

Expected: обе команды PASS.

- [ ] **Step 7: Commit layer 1**

```bash
git add packages/core/metadata/binary packages/core/metadata/projectState/binary
git commit -m "refactor: :recycle: вынести общий двоичный hash-index"
```

---

### Task 2: Indexed full-sync composition capability

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/sharedMetadata.ts`
- Modify: `packages/core/metadata/fullSyncToXml/sharedMetadata.test.ts`
- Modify: `packages/core/metadata/resourceTopology/capabilities.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncPreparedToXML.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts`

**Interfaces:**
- Consumes: `buildBinaryHashIndex`, `openBinaryHashIndex`, `findBinaryHashIndex`; существующая отсортированная по `assignment.id` таблица композиции.
- Produces:

```ts
export interface MetadataXmlPrepareComposition {
  children(ownerLogicalAddress: string): readonly MetadataXmlPrepareCompositionEntry[]
}

export interface FullXmlSyncCompositionReader extends MetadataXmlPrepareComposition {
  assignment(id: string): FullXmlSyncCompositionEntry | undefined
  itemTypeByYamlDir(): Readonly<Record<string, string>>
}
```

- `FullXmlSyncSharedCompositionSnapshot` дополнительно содержит `childEntryIds`, `ownerRanges` и `ownerLookup`; каждый из них — `SharedArrayBuffer` либо `BinaryHashIndex`, пригодный для structured clone.
- Диапазон хранится как два `Uint32`: `start`, `count`. `childEntryIds` хранит индексы строк основной таблицы; внутри владельца они возрастают, поэтому прежний порядок по `assignment.id` сохраняется.
- Хэш владельца вычисляется по UTF-8 через `xxh3.xxh64`; `keyEquals` сравнивает исходную строку владельца из первой записи диапазона.

- [ ] **Step 1: Write failing composition-reader tests**

В существующий `sharedMetadata.test.ts` добавить без XML-фикстур искусственные назначения для двух владельцев и один owner-less объект. Проверить:

```ts
expect(left.children("Справочник.Товары").map(({ itemName }) => itemName))
  .toEqual(["ФормаСписка", "ФормаЭлемента"])
expect(left.children("Справочник.Нет")).toEqual([])
expect(left.itemTypeByYamlDir()).toEqual({ Справочник: "MetadataCatalog" })
expect(right.snapshotOwnerLookupSlotsForTests()).toBe(left.snapshotOwnerLookupSlotsForTests())
```

Не добавлять публичный тестовый метод из последней строки. Вместо него сравнить `shared.ownerLookup.slots` у двух reader через исходный `shared` и результаты reader; цель — подтвердить один общий буфер, а не внутренности reader.

Чтобы детерминированно проверить коллизии, разрешить `createFullXmlSyncCompositionSnapshot(assignments, { hashOwner })` только как внутренний параметр с default `xxh3.xxh64`; тест передаёт `() => 7n` и убеждается, что владельцы не смешиваются.

- [ ] **Step 2: Run the composition tests and verify the indexed API is absent**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/sharedMetadata.test.ts
```

Expected: FAIL из-за отсутствующих `children`, `itemTypeByYamlDir` и owner lookup.

- [ ] **Step 3: Build owner ranges and the shared owner lookup**

После сортировки основной таблицы по `id`:

1. Собрать пары `{ ownerStringId, entryId }` только для записей с владельцем.
2. Отсортировать пары по `ownerStringId`, затем по `entryId`.
3. Записать `entryId` в общий `Uint32Array childEntryIds`.
4. Для каждой группы записать `{ start, count }` в общий `Uint32Array ownerRanges`.
5. Построить `ownerLookup` из хэша декодированных UTF-8 владельцев и `rangeId`.
6. В reader один раз проверить размеры `childEntryIds`, `ownerRanges`, lookup и каждый диапазон; недопустимая граница — `Error("Повреждён shared composition snapshot")`.

`children()` должен делать только lookup одного владельца и декодировать записи найденного диапазона:

```ts
children(ownerLogicalAddress) {
  const rangeId = findBinaryHashIndex(ownerLookup, hashOwner(ownerLogicalAddress), (candidate) =>
    ownerOfRange(candidate) === ownerLogicalAddress
  )
  if (rangeId === undefined) return []
  const { start, count } = rangeAt(rangeId)
  return Array.from({ length: count }, (_, index) => capabilityEntryAt(childEntryIds[start + index]!))
}
```

`itemTypeByYamlDir()` проходит компактные integer-строки напрямую и вызывает небольшой helper `ownerDir(sourceProjectPath, role)`; он не вызывает `entryAt()` и не создаёт `FullXmlSyncCompositionEntry[]`.

- [ ] **Step 4: Replace the capability array with a semantic query**

В `resourceTopology/capabilities.ts` заменить:

```ts
readonly composition: readonly MetadataXmlPrepareCompositionEntry[]
```

на:

```ts
readonly composition: MetadataXmlPrepareComposition
```

В applied-object capability запросить детей один раз:

```ts
const children = params.composition.children(params.ownerLogicalAddress)
for (const childCollection of params.rule.childCollections ?? []) {
  const names = children
    .filter((entry) => entry.assignmentRole === "fileItem" && entry.itemType === fileItemRule.itemType)
    .map((entry) => entry.itemName)
  if (names.length > 0) values.set(childCollection.propertyKey, names)
}
```

Условие по `ownerLogicalAddress` из фильтра удалить: reader уже вернул только детей владельца. Частных условий по конкретным `itemType` не добавлять.

- [ ] **Step 5: Pass the reader through prepareAssignment without materialization**

Заменить параметр `assignments?: readonly FullXmlSyncCompositionEntry[]` на обязательный:

```ts
composition: MetadataXmlPrepareComposition
```

и передавать capability `composition: params.composition` без `.map(...)`. В тестах, где композиция не важна, использовать один общий helper:

```ts
const emptyComposition: MetadataXmlPrepareComposition = { children: () => [] }
```

- [ ] **Step 6: Add the no-full-scan capability regression test**

В ближайший applied-object/prepare test передать spy-композицию:

```ts
const children = vi.fn((owner: string) => owner === "Справочник.Товары" ? [formEntry] : [])
// выполнить подготовку XML владельца
expect(children).toHaveBeenCalledExactlyOnceWith("Справочник.Товары")
expect(prepared.xml).toContainEquivalentChildForms(["ФормаЭлемента"])
```

Использовать существующие проверки формы XML вместо придуманного matcher `toContainEquivalentChildForms`: проверить тот же путь объекта/массива, который уже утверждает `syncPreparedToXML.test.ts`. У spy-объекта нет `assignments()` — успешный тест доказывает отсутствие полного обхода в capability/prepare-пути.

- [ ] **Step 7: Run targeted composition and preparation tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/fullSyncToXml/sharedMetadata.test.ts \
  metadata/fullSyncToXml/prepareAssignment.test.ts \
  metadata/orchestration/appliedObject/syncPreparedToXML.test.ts
```

Expected: PASS; подготовка владельца вызывает один `children(owner)` и сохраняет прежний порядок имён.

- [ ] **Step 8: Verify types and duplicates for layer 2**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm check:duplicates -- --base 3c9281164
```

Expected: PASS; проверка типов подтверждает, что orchestration знает только интерфейс `MetadataXmlPrepareComposition`, не `FullXmlSyncCompositionReader`.

- [ ] **Step 9: Commit layer 2**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/resourceTopology/capabilities.ts packages/core/metadata/orchestration/appliedObject
git commit -m "perf: :zap: индексировать композицию полной синхронизации"
```

---

### Task 3: Build the worker YAML type catalog once

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`

**Interfaces:**
- Consumes: `FullXmlSyncCompositionReader.itemTypeByYamlDir()` и сам reader как `MetadataXmlPrepareComposition`.
- Produces: `InitializedFullXmlSyncWorkerState.itemTypeByYamlDir: Readonly<Record<string, string>>`; повторные `execute`/`executeBatch` не читают всю композицию.
- Test seam: optional `createCompositionReader` в `FullXmlSyncWorkerDependencies`, default `createFullXmlSyncCompositionReader`.

- [ ] **Step 1: Write the failing initialize-once worker test**

Расширить dependencies и в тесте обернуть настоящий reader:

```ts
let catalogBuilds = 0
const reader = createFullXmlSyncCompositionReader(createFullXmlSyncCompositionSnapshot(assignments))
await runFullXmlSyncWorkerCommand(initializeCommand, {
  openReadSession: () => emptyReadSession(),
  createCompositionReader(snapshot) {
    return {
      ...reader,
      itemTypeByYamlDir() {
        catalogBuilds += 1
        return reader.itemTypeByYamlDir()
      },
    }
  },
})
await runFullXmlSyncWorkerCommand({ kind: "executeBatch", assignments: [assignments[0]!] })
await runFullXmlSyncWorkerCommand({ kind: "executeBatch", assignments: [assignments[1]!] })
expect(catalogBuilds).toBe(1)
```

Если методы reader не перечисляются spread-операцией, создать явный adapter с `assignment`, `children`, `itemTypeByYamlDir`.

- [ ] **Step 2: Run the worker test and verify the catalog is rebuilt per batch**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts
```

Expected: FAIL: dependency seam отсутствует либо счётчик больше `1`.

- [ ] **Step 3: Move catalog construction into initialize**

В initialize:

```ts
const composition = dependencies.createCompositionReader(command.composition)
const itemTypeByYamlDir = composition.itemTypeByYamlDir()
initializedState = {
  // прежние поля
  composition,
  itemTypeByYamlDir,
}
```

В `executeAssignments` удалить локальный `itemTypeByYamlDir(state.composition.assignments())`; передавать `state.itemTypeByYamlDir` в `prepareYamlFiles`, а `composition: state.composition` в `prepareFullXmlSyncAssignment`. Удалить старую функцию, которая принимала materialized assignments.

- [ ] **Step 4: Keep dispose and test introspection bounded**

`dispose` по-прежнему обнуляет весь `initializedState`. В `fullXmlSyncWorkerStateForTests()` не возвращать сам каталог; достаточно существующего `{ initialized: false }` после dispose и счётчика dependency seam в тесте.

- [ ] **Step 5: Run worker/full-sync tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/fullSyncToXml/worker.test.ts \
  metadata/fullSyncToXml/workerPool.test.ts \
  metadata/fullSyncToXml/syncConfiguration.test.ts
```

Expected: PASS; две пачки используют каталог, построенный один раз при initialize.

- [ ] **Step 6: Verify types and duplicates for layer 3**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm check:duplicates -- --base 3c9281164
```

Expected: PASS; в `worker.ts` нет `composition.assignments()`.

- [ ] **Step 7: Commit layer 3**

```bash
git add packages/core/metadata/fullSyncToXml/worker.ts packages/core/metadata/fullSyncToXml/worker.test.ts
git commit -m "perf: :zap: переиспользовать каталог типов в sync worker"
```

---

### Task 4: Shared configuration-index lookup tables

**Files:**
- Modify: `packages/core/metadata/configurationIndex/sharedSnapshot.ts`
- Modify: `packages/core/metadata/configurationIndex/sharedSnapshot.test.ts`
- Modify: `packages/core/metadata/configurationIndex/encode.test.ts`
- Modify: `packages/core/metadata/projectState/binary/architecture.test.ts`

**Interfaces:**
- Consumes: проверенный encoded configuration index `1.3`, `BinaryHashIndex`, существующие `stringOffsets` и `entityOffsets`.
- Produces:

```ts
export interface SharedConfigurationIndexSnapshot {
  readonly bytes: SharedArrayBuffer
  readonly byteLength: number
  readonly stringOffsets: SharedArrayBuffer
  readonly entityOffsets: SharedArrayBuffer
  readonly stringLookup: BinaryHashIndex
  readonly fileLookup: BinaryHashIndex
  readonly entityLookup: BinaryHashIndex
  readonly sourceEntityOffsets: SharedArrayBuffer
  readonly sourceEntityRanges: SharedArrayBuffer
  readonly sourceEntityLookup: BinaryHashIndex
}
```

- `stringLookup`: UTF-8 bytes → `stringId` (IDs остаются 1-based).
- `fileLookup`: `projectPath stringId` → file record index; offset вычисляется как `recordId * 16`.
- `entityLookup`: `logicalAddress stringId` → entity record index; offset берётся из `entityOffsets[recordId]`.
- `sourceEntityLookup`: `sourceProjectPath stringId` → rangeId; `sourceEntityRanges` содержит пары `start/count`, `sourceEntityOffsets` — offsets исходных entity в прежнем порядке.
- Numeric keys кодируются одним локальным helper через 4 little-endian bytes и хэшируются `xxh3.xxh64`; строковые ключи хэшируются непосредственно по bytes секции без декодирования.

- [ ] **Step 1: Strengthen shared-snapshot tests before production changes**

В существующем тесте двух reader проверить общность всех lookup buffers:

```ts
expect(first.snapshot.stringLookup.slots).toBe(second.snapshot.stringLookup.slots)
expect(first.snapshot.fileLookup.slots).toBe(second.snapshot.fileLookup.slots)
expect(first.snapshot.entityLookup.slots).toBe(second.snapshot.entityLookup.slots)
expect(first.snapshot.sourceEntityLookup.slots).toBe(second.snapshot.sourceEntityLookup.slots)
expect(first.snapshot.sourceEntityOffsets).toBe(second.snapshot.sourceEntityOffsets)
```

Сохранить существующие проверки `file`, `files`, `entity`, `entities`, `entitiesBySourceProjectPath`, отсутствующих ключей и порядка.

- [ ] **Step 2: Add deterministic collision and corruption cases**

Добавить internal options только к snapshot builder:

```ts
interface SnapshotConfigurationIndexOptions extends DecodeConfigurationIndexOptions {
  readonly hashStringBytes?: (bytes: Uint8Array) => bigint
  readonly hashStringId?: (id: number) => bigint
}
```

Default использует xxh3; тест передаёт обе функции `() => 5n` и убеждается, что разные строки/files/entities/source paths находятся по исходному ключу. В таблицу случаев повреждения добавить:

- `capacity` не степень двойки;
- lookup slots короче объявленной capacity;
- `recordId` вне string/file/entity/range;
- source range выходит за `sourceEntityOffsets`.

Для последнего набора сначала построить корректный snapshot, затем создать shallow-copy snapshot с испорченным соответствующим общим буфером и ожидать ошибку при `createConfigurationIndexReader`, а не fallback-поиск.

- [ ] **Step 3: Run shared-snapshot tests and verify lookup fields are absent**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/sharedSnapshot.test.ts
```

Expected: FAIL из-за отсутствующих общих lookup-полей/options.

- [ ] **Step 4: Build all lookup tables once in snapshotConfigurationIndex**

После `decodeConfigurationIndex`, копирования bytes и построения offsets:

1. Прочитать строки как `{ id, offset, byteLength, bytes }`; не вызывать `TextDecoder`.
2. Построить `stringLookup` с `recordId = stringId`.
3. Пройти fixed 16-byte file records и построить `fileLookup` с `recordId = fileIndex`.
4. Пройти `entityOffsets` и построить `entityLookup` с `recordId = entityIndex`.
5. Сгруппировать entity offsets по `sourceProjectPathId` в порядке исходного `entityOffsets`, записать общий flat-массив и ranges.
6. Построить `sourceEntityLookup` с `recordId = rangeId`.

Builder обязан проверить уникальность исходных ключей там, где API ожидает одну запись (`string`, `file`, `logicalAddress`), и бросить техническую ошибку при дубле вместо молчаливого overwrite.

- [ ] **Step 5: Open and validate lookup views in the reader constructor**

Конструктор вызывает `openBinaryHashIndex` для четырёх индексов и проверяет предметные пределы всех занятых `recordId` через `forEachBinaryHashIndexEntry`:

```ts
assertLookupRecordIds(snapshot.stringLookup, 1, stringOffsets.length)
assertLookupRecordIds(snapshot.fileLookup, 0, fileCount - 1)
assertLookupRecordIds(snapshot.entityLookup, 0, entityOffsets.length - 1)
assertLookupRecordIds(snapshot.sourceEntityLookup, 0, rangeCount - 1)
assertRanges(sourceEntityRanges, sourceEntityOffsets.length)
```

Пустая таблица корректна: capacity равна `1`, size `0`; пределы recordId для неё не проверяются до появления занятого слота.

- [ ] **Step 6: Replace the four local full Maps with shared lookup probes**

Удалить поля:

```ts
private stringIds?: Map<string, number>
private fileOffsetByPathId?: Map<number, number>
private entityOffsetByAddressId?: Map<number, number>
private entityOffsetsBySourcePathId?: Map<number, readonly number[]>
```

Оставить только `stringCache`, который содержит реально декодированные найденные значения. Реализовать:

```ts
private findStringId(value: string): number | undefined {
  const encoded = textEncoder.encode(value)
  return findBinaryHashIndex(this.snapshot.stringLookup, hashStringBytes(encoded), (stringId) =>
    this.stringBytesEqual(stringId, encoded)
  )
}

private fileOffset(projectPathId: number): number | undefined {
  const record = findBinaryHashIndex(this.snapshot.fileLookup, hashStringId(projectPathId), (fileIndex) =>
    files.readUInt32LE(fileIndex * 16) === projectPathId
  )
  return record === undefined ? undefined : record * 16
}
```

Для entity сравнивать `logicalAddressId` в исходной записи, для source range — `sourceProjectPathId` первой entity диапазона. `files()` и `entities()` остаются потоковыми полными обходами по публичному договору; lookup-методы полного обхода не делают.

- [ ] **Step 7: Prove encoded configuration index 1.3 is unchanged**

В `encode.test.ts` сохранить encoded bytes до создания shared snapshot, выполнить все reader lookup и сравнить:

```ts
const encoded = encodeConfigurationIndex(sampleSnapshot())
const before = Buffer.from(encoded)
const reader = createConfigurationIndexReader(snapshotConfigurationIndex(encoded))
reader.file("Документы/Заказ.yaml")
reader.entity("Документ.Заказ")
;[...reader.entitiesBySourceProjectPath("Документы/Заказ.yaml")]
expect(Buffer.from(encoded)).toEqual(before)
expect(decodeConfigurationIndex(encoded)).toEqual(decodeConfigurationIndex(before))
```

Не сериализовать lookup-таблицы и не менять header/version encoder.

- [ ] **Step 8: Add architectural source guards for removed hot paths**

В существующий `projectState/binary/architecture.test.ts` добавить отдельный наблюдаемый договор рабочих путей:

```ts
const composition = source("fullSyncToXml/sharedMetadata.ts")
const worker = source("fullSyncToXml/worker.ts")
const configurationIndex = source("configurationIndex/sharedSnapshot.ts")

expect(worker).not.toContain("composition.assignments()")
expect(configurationIndex).not.toContain("private stringIds?: Map")
expect(configurationIndex).not.toContain("fileOffsetByPathId?: Map")
expect(configurationIndex).not.toContain("entityOffsetByAddressId?: Map")
expect(configurationIndex).not.toContain("entityOffsetsBySourcePathId?: Map")
expect(composition).toContain("findBinaryHashIndex")
```

Это дополняет поведенческие тесты и не заменяет dependency-cruiser.

- [ ] **Step 9: Run configuration-index and cross-consumer tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/configurationIndex/sharedSnapshot.test.ts \
  metadata/configurationIndex/encode.test.ts \
  metadata/configurationIndex/referenceView.test.ts \
  metadata/configurationIndex/fromYAMLToXML.test.ts \
  metadata/forms/clientApplicationForm/baseFormIndex.test.ts \
  metadata/projectState/binary/architecture.test.ts
```

Expected: PASS; два reader разделяют lookup slots, API возвращает прежние значения и порядок, encoded `1.3` не меняется.

- [ ] **Step 10: Verify types and duplicates for layer 4**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm check:duplicates -- --base 3c9281164
```

Expected: PASS.

- [ ] **Step 11: Commit layer 4**

```bash
git add packages/core/metadata/configurationIndex packages/core/metadata/projectState/binary/architecture.test.ts
git commit -m "perf: :zap: разделить lookup-индексы конфигурации между worker"
```

---

### Task 5: Full verification, ERP round-trip, time and memory profile

**Files:**
- Modify only if needed for a discovered regression: files already named in Tasks 1–4.
- Read: `.agents/skills/round-trip-yaml/SKILL.md`
- Read: `docs/superpowers/specs/2026-08-04-full-sync-shared-lookup-indexes-design.md`
- Runtime input: `/Users/nikita/git/round-trip-compact/cf/erp`
- Runtime YAML project: existing ERP YAML catalog produced by round-trip, as reported by the skill.

**Interfaces:**
- Consumes: completed layers 1–4 and the same ERP configuration used for the baseline.
- Produces: evidence for semantic equivalence, CPU/RSS change, absence of repeated full composition materialization and per-worker full reverse `Map`.

- [ ] **Step 1: Run the complete required verification**

Run from worktree root:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm check:duplicates -- --base 3c9281164
```

Expected: all PASS. Не запускать `pnpm test:architecture:rules`, так как правила и инструмент не менялись.

- [ ] **Step 2: Inspect the complete diff and architecture agreement**

Run:

```bash
git diff --check
git diff --stat 3c9281164...HEAD
git diff 3c9281164...HEAD -- packages/core/metadata/binary packages/core/metadata/fullSyncToXml packages/core/metadata/configurationIndex packages/core/metadata/projectState/binary packages/core/metadata/resourceTopology/capabilities.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts
```

Expected:

- нет изменений XML fixtures, `rules.ts`, `.dependency-cruiser.mjs`, `tools/dependency-cruiser`, форматов/версий;
- нет `composition.assignments()` в full-sync production path;
- нет четырёх полных reverse `Map` в `SharedConfigurationIndexReader`;
- общий `metadata/binary/hashIndex.ts` не импортирует предметные metadata-модули;
- `.agents/architecture.md` соответствует реализации и не требует изменения.

- [ ] **Step 3: Read the round-trip-yaml skill and verify the active XML catalog is clean**

Перед реальным прогоном перечитать `.agents/skills/round-trip-yaml/SKILL.md`. Затем:

```bash
git -C /Users/nikita/git/round-trip-compact status --short -- cf/erp
```

Expected: пустой вывод. Если есть изменения, остановиться и попросить пользователя сохранить либо откатить их; самостоятельно не выполнять stash/restore/clean.

- [ ] **Step 4: Run the same ERP round-trip with concurrency 4**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/erp \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

Expected: sync завершается; число и категории XML diff не хуже зафиксированного до оптимизации результата. Сам skill оставляет XML diff как диагностический результат — не восстанавливать каталог автоматически.

- [ ] **Step 5: Measure direct full sync wall time and RSS without CPU instrumentation**

Использовать YAML-каталог и временный XML-каталог, напечатанные round-trip skill. Очистить только конкретный временный output-каталог безопасным механизмом самого skill либо создать новый каталог через `mktemp -d`; не удалять широкие каталоги. Запустить ту же CLI sync-команду с `concurrency: 4` под:

```bash
/usr/bin/time -l pnpm --filter @nakidka/cli exec nkdk sync \
  <ERP_YAML_DIR> <NEW_EMPTY_XML_DIR> --concurrency 4
```

Если фактический CLI принимает concurrency только из настроек проекта, не добавлять неподдерживаемый флаг: подтвердить `concurrency: 4` по debug/profile-выводу и выполнить установленную команду sync. Записать `real`, `user`, `sys`, maximum resident set size и количество записанных XML.

Baseline для сравнения:

| Метрика | До изменения |
|---|---:|
| YAML assignments | 119 781 |
| XML files | 139 194 |
| real | 594,67 с |
| user | 1 484,18 с |
| sys | 661,90 с |
| max RSS | 7 223 558 144 bytes (6,73 GiB) |
| refreshAndValidate | 11,9 с |

Expected: та же полнота результата; RSS и user CPU заметно ниже baseline. Не превращать относительное улучшение во временной CI-порог.

- [ ] **Step 6: Capture one detailed CPU profile of the optimized sync**

Запустить тот же direct sync в новый пустой output с Node CPU profiler тем же способом, который использовался для baseline (через `NODE_OPTIONS=--cpu-prof...` либо установленную проектную profile-команду). Сохранить `.cpuprofile` в `/private/tmp`, затем агрегировать self/total time по функциям.

Expected:

- `state.composition.assignments()` отсутствует в профиле;
- `findStringId` не строит полный string `Map` и не декодирует весь 424-MiB pool на worker;
- нет четырёх независимых полных reverse `Map` configuration index;
- оставшиеся крупные затраты относятся к YAML→XML, сериализации/записи либо GC, а не к удалённым алгоритмам.

Сравнить с baseline profile: repeated composition materialization ~576 CPU-секунд, `findStringId` ~380 CPU-секунд, GC ~239 CPU-секунд, YAML→XML property conversion ~75 CPU-секунд.

- [ ] **Step 7: Re-run final safeguards after any profile-driven correction**

Если профиль выявил регрессию и код пришлось скорректировать, сначала добавить/усилить ближайший падающий тест, затем повторить:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm check:duplicates -- --base 3c9281164
```

Expected: all PASS. Если код после Step 1 не менялся, повторный полный `pnpm test` не нужен; повторить только `git diff --check` и финальную проверку дублей.

- [ ] **Step 8: Commit final test-only corrections if any**

Если после профиля были изменения:

```bash
git add packages/core/metadata
git commit -m "test: :white_check_mark: закрепить общие lookup-индексы sync"
```

Если изменений не было, не создавать пустой коммит.

- [ ] **Step 9: Prepare the final implementation report**

Отчёт должен перечислить:

- расширенные/перенесённые тесты и уникальный договор каждого нового теста;
- результаты `type-check`, полного `pnpm test`, dependency-cruiser и jscpd;
- результат ERP round-trip и сохранённые расхождения;
- таблицу baseline/after для real/user/sys/RSS;
- подтверждение `concurrency: 4` и сохранённого `refreshAndValidate`;
- новые главные CPU/RSS потребители после оптимизации;
- отсутствие изменений дисковых форматов и `.agents/architecture.md`.

## Self-review

- Spec coverage: Tasks 1–4 покрывают общий алгоритм, композицию, worker lifecycle, четыре configuration lookup и ошибки целостности; Task 5 покрывает совместимость, полный набор проверок, round-trip и профиль ERP.
- Placeholder scan: план не содержит `TBD`, `TODO`, «обработать ошибки» без условий или ссылок «аналогично Task N».
- Type consistency: `BinaryHashIndex`, `MetadataXmlPrepareComposition`, `FullXmlSyncCompositionReader.itemTypeByYamlDir()` и все поля `SharedConfigurationIndexSnapshot` определены до первого потребителя и используются с теми же именами.
- Test architecture: сначала усиливаются ближайшие существующие тесты; новый файл теста создаётся только для самостоятельного нейтрального binary hash-index.
- Architecture: neutral binary не зависит от project state/fullSync/configuration index; orchestration получает только предметный query interface; architecture rules не меняются.
