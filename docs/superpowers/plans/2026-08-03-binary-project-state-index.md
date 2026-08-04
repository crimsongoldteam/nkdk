# Двоичное состояние проекта — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить SQLite-состояние проекта единым двоичным файлом и несколькими неизменяемыми `SharedArrayBuffer`, сохранив договоры validation, import, полной sync, поиска ссылок и переименования.

**Architecture:** Главный процесс лениво загружает один двоичный файл в набор общих буферов и является единственным владельцем их замены. Structurae предоставляет типизированные представления записей, собственные хэш-таблицы выполняют поиск, worker читают общую память без копирования и возвращают новые двоичные вклады через Piscina `move()`.

**Tech Stack:** TypeScript 7, Node.js 26, `SharedArrayBuffer`, `DataView`, structurae 4.0.2, `@node-rs/xxhash`, Piscina 5, Vitest 4.

## Global Constraints

- Двоичный формат имеет версию `0.4.1`; это единственный признак совместимости, отдельных отпечатков схем и правил нет.
- Единственный файл состояния: `.nkdk/cache/project-state.bin`; SQLite-файл не читается и не мигрирует.
- В памяти один текущий снимок состоит из нескольких `SharedArrayBuffer`; полной JSON- или `Map`-копии состояния нет.
- Structurae используется для представлений записей, но не как `Dictionary`, `Map` или основной поисковый индекс.
- Собственные поисковые таблицы используют линейное пробирование, заполнены не более чем на 80% и после совпадения хэша сравнивают исходный ключ.
- Файл хэшируется как сейчас через `xxhash64-be-v1`; `stat`, `fstat`, `size`, `mtimeNs`, `dev` и `inode` не добавляются.
- Worker возвращает двоичные `ArrayBuffer` через Piscina `move()`; опубликованные `SharedArrayBuffer` никогда не входят в transfer list.
- Полная dependency validation выполняется при каждой актуализации и не сохраняется; локальные diagnostics сохраняются.
- Validation-ошибки не отменяют публикацию состояния; техническая ошибка сохраняет прежний снимок.
- Одновременно изменяется только один проект; следующее изменение ждёт фонового сохранения предыдущего.
- Частичная sync не реализуется; публичный договор `ignoreValidationErrors` не меняется.
- Mutation testing в этой задаче не запускается.
- Модульный и небольшой интеграционный тест должны стремиться к 10 мс и не превышать 50 мс; большие наборы разрешены только отдельному стенду.
- Холодная compiled standalone validation `/Users/nikita/git/nkdk-yaml` должна завершаться не дольше 2 минут; внешний предел профильного запуска — 115 секунд.
- Перед завершением обязательны `pnpm check:duplicates -- --base 0e5403794b0d6694ee2f33d283cf0011478cb96c`, `pnpm type-check` и один полный `pnpm test`.

## Карта файлов

Новые файлы `packages/core/metadata/projectState/binary/` разделяются по ответственности:

| Файл | Ответственность |
|---|---|
| `format.ts` | Сигнатура, версия `0.4.1`, каталог разделов и проверка заголовка. |
| `layouts.ts` | Только structurae-схемы фиксированных заголовков и записей. |
| `hashIndex.ts` | Построение и чтение неизменяемой хэш-таблицы с пределом 80%. |
| `stringPool.ts` | Уникальные UTF-8 строки и поиск строки без полной декодированной копии. |
| `valueCodec.ts` | Детерминированное двоичное кодирование переносимых вложенных значений через идентификаторы строк. |
| `contribution.ts` | Формат двоичных вкладов validation/import и представления над ними. |
| `snapshot.ts` | Тип набора общих буферов и неизменяемое представление снимка. |
| `builder.ts` | Слияние прежнего снимка, замен и удалений в новый снимок. |
| `readToken.ts` | Одноразовое разрешение с общим атомарным признаком захвата. |
| `readSession.ts` | Реализация пакетных запросов `ProjectStateReadSession`. |
| `store.ts` | Транзакционный адаптер `ProjectStateStore` над текущим и строящимся снимком. |
| `persistence.ts` | Ленивое чтение, контрольная сумма и атомарная запись одного файла. |
| `testData.ts` | Общие маленькие конструкторы YAML/resource-вкладов для двоичных тестов. |
| `testFixture.ts` | Маленькая двоичная фикстура общего договора хранилища. |

Существующие файлы `store.ts`, `readSession.ts`, `refresh.ts`, `service.ts`, `importSession.ts` и worker-файлы сохраняют предметные договоры. SQLite-каталог, отдельный writer worker, его протокол и fingerprint-совместимость удаляются только после переключения всех потребителей.

---

### Task 1: Версия формата и structurae-представления

**Files:**
- Create: `packages/core/metadata/projectState/binary/format.ts`
- Create: `packages/core/metadata/projectState/binary/layouts.ts`
- Create: `packages/core/metadata/projectState/binary/format.test.ts`
- Modify: `packages/core/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/core/scripts/build.mjs`
- Modify: `packages/mcp/scripts/build.mjs`

**Interfaces:**
- Consumes: `DataView`, `SharedArrayBuffer`, structurae `View`.
- Produces: `PROJECT_STATE_FORMAT_VERSION`, `ProjectStateSectionKind`, `encodeProjectStateHeader()`, `decodeProjectStateHeader()` для всех последующих задач.

- [ ] **Step 1: Написать падающий тест заголовка**

```ts
import { describe, expect, it } from "vitest"
import {
  PROJECT_STATE_FORMAT_VERSION,
  decodeProjectStateHeader,
  encodeProjectStateHeader,
} from "./format"

it("восстанавливает заголовок 0.4.1 и отвергает другую patch-версию", () => {
  const bytes = encodeProjectStateHeader({
    sections: [{ kind: "strings", offset: 128, byteLength: 64, records: 2 }],
    payloadHash: 7n,
  })
  expect(decodeProjectStateHeader(bytes)).toMatchObject({
    version: PROJECT_STATE_FORMAT_VERSION,
    payloadHash: 7n,
  })
  new DataView(bytes.buffer).setUint16(12, 2, true)
  expect(() => decodeProjectStateHeader(bytes)).toThrow(/0\.4\.1|верси/iu)
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/format.test.ts --no-isolate`

Expected: FAIL с ошибкой импорта `./format`.

- [ ] **Step 3: Добавить structurae 4.0.2 и реализовать заголовок**

Run: `pnpm --filter @nkdk/core add structurae@4.0.2`

В `format.ts` зафиксировать публичный договор:

```ts
export const PROJECT_STATE_FORMAT_VERSION = Object.freeze({ major: 0, minor: 4, patch: 1 })

export type ProjectStateSectionKind =
  | "strings"
  | "files"
  | "facts"
  | "lookups"
  | "diagnostics"

export interface ProjectStateSectionDescriptor {
  readonly kind: ProjectStateSectionKind
  readonly offset: number
  readonly byteLength: number
  readonly records: number
}

export function encodeProjectStateHeader(input: {
  readonly sections: readonly ProjectStateSectionDescriptor[]
  readonly payloadHash: bigint
}): Uint8Array<ArrayBuffer>

export function decodeProjectStateHeader(bytes: Uint8Array): {
  readonly version: typeof PROJECT_STATE_FORMAT_VERSION
  readonly sections: readonly ProjectStateSectionDescriptor[]
  readonly payloadHash: bigint
}
```

`layouts.ts` должен создавать structurae-view для фиксированной части заголовка и записей каталога. `decodeProjectStateHeader()` обязан проверить сигнатуру, точную версию, порядок и непересечение разделов, безопасные целые смещения и отсутствие неизвестных видов разделов.

Добавить `"structurae"` в `external` обеих сборок.

- [ ] **Step 4: Проверить тест и типы пакета**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/format.test.ts --no-isolate`

Expected: PASS.

Run: `pnpm --filter @nkdk/core type-check`

Expected: PASS.

- [ ] **Step 5: Зафиксировать слой**

```bash
git add packages/core/package.json pnpm-lock.yaml packages/core/scripts/build.mjs packages/mcp/scripts/build.mjs packages/core/metadata/projectState/binary/format.ts packages/core/metadata/projectState/binary/layouts.ts packages/core/metadata/projectState/binary/format.test.ts
git commit -m "feat: :sparkles: добавить формат двоичного состояния"
```

### Task 2: Собственный неизменяемый хэш-индекс

**Files:**
- Create: `packages/core/metadata/projectState/binary/hashIndex.ts`
- Create: `packages/core/metadata/projectState/binary/hashIndex.test.ts`
- Modify: `packages/core/metadata/projectState/binary/layouts.ts`

**Interfaces:**
- Consumes: массивы 64-битных хэшей и 32-битных идентификаторов записей.
- Produces: `BinaryHashIndex`, `buildBinaryHashIndex()`, `findBinaryHashIndex()` для строк и предметных индексов.

- [ ] **Step 1: Написать падающие проверки коллизии и заполнения**

```ts
it("не принимает коллизию за совпадение ключа", () => {
  const index = buildBinaryHashIndex(
    new BigUint64Array([11n, 11n]),
    new Uint32Array([3, 9]),
  )
  expect(findBinaryHashIndex(index, 11n, (recordId) => recordId === 9)).toBe(9)
  expect(findBinaryHashIndex(index, 11n, () => false)).toBeUndefined()
})

it("держит заполнение не выше 80 процентов", () => {
  const index = buildBinaryHashIndex(
    new BigUint64Array(81).fill(1n),
    Uint32Array.from({ length: 81 }, (_, value) => value),
  )
  expect(index.size / index.capacity).toBeLessThanOrEqual(0.8)
})
```

- [ ] **Step 2: Подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/hashIndex.test.ts --no-isolate`

Expected: FAIL с ошибкой импорта `./hashIndex`.

- [ ] **Step 3: Реализовать таблицу поверх `SharedArrayBuffer`**

```ts
export interface BinaryHashIndex {
  readonly slots: SharedArrayBuffer
  readonly size: number
  readonly capacity: number
}

export function buildBinaryHashIndex(
  hashes: BigUint64Array,
  recordIds: Uint32Array,
): BinaryHashIndex

export function findBinaryHashIndex(
  index: BinaryHashIndex,
  hash: bigint,
  keyEquals: (recordId: number) => boolean,
): number | undefined
```

Ёмкость вычислять до вставки как степень двойки, достаточную для `ceil(size / 0.8)`. Пустую ячейку кодировать отдельным флагом structurae-записи, чтобы хэш `0n` оставался допустимым. Поиск прекращать только на пустой ячейке либо после обхода всей таблицы; совпавший хэш всегда передавать в `keyEquals`.

- [ ] **Step 4: Запустить тесты индекса**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/hashIndex.test.ts --no-isolate`

Expected: PASS, включая 80% и искусственную коллизию.

- [ ] **Step 5: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/binary/hashIndex.ts packages/core/metadata/projectState/binary/hashIndex.test.ts packages/core/metadata/projectState/binary/layouts.ts
git commit -m "feat: :sparkles: добавить двоичный хэш-индекс"
```

### Task 3: Таблица строк и двоичные вложенные значения

**Files:**
- Create: `packages/core/metadata/projectState/binary/stringPool.ts`
- Create: `packages/core/metadata/projectState/binary/stringPool.test.ts`
- Create: `packages/core/metadata/projectState/binary/valueCodec.ts`
- Create: `packages/core/metadata/projectState/binary/valueCodec.test.ts`
- Modify: `packages/core/metadata/projectState/binary/layouts.ts`

**Interfaces:**
- Consumes: `buildBinaryHashIndex()` из Task 2 и переносимые значения, разрешённые `assertProjectStatePortableData()`.
- Produces: `BinaryStringPoolBuilder`, `BinaryStringPool`, `readBinaryString()`, `encodeBinaryValue()`, `decodeBinaryValue()`.

- [ ] **Step 1: Написать падающие проверки дедупликации и точного round-trip**

```ts
it("хранит одинаковую UTF-8 строку один раз", () => {
  const builder = new BinaryStringPoolBuilder()
  const first = builder.intern("Справочник.Товары")
  const second = builder.intern("Справочник.Товары")
  const pool = builder.finish()
  expect(first).toBe(second)
  expect(pool.count).toBe(1)
  expect(readBinaryString(pool, first)).toBe("Справочник.Товары")
})

it("кодирует вложенное значение без JSON", () => {
  const strings = new BinaryStringPoolBuilder()
  const encoded = encodeBinaryValue({ kinds: ["object"], nullable: false, count: 2 }, strings)
  const pool = strings.finish()
  expect(decodeBinaryValue(encoded, pool)).toEqual({ kinds: ["object"], nullable: false, count: 2 })
  expect(new TextDecoder().decode(encoded)).not.toContain("kinds")
})
```

- [ ] **Step 2: Подтвердить падение обоих файлов**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/stringPool.test.ts metadata/projectState/binary/valueCodec.test.ts --no-isolate`

Expected: FAIL с отсутствующими модулями.

- [ ] **Step 3: Реализовать таблицу строк**

```ts
export interface BinaryStringPool {
  readonly records: SharedArrayBuffer
  readonly utf8: SharedArrayBuffer
  readonly lookup: BinaryHashIndex
  readonly count: number
}

export class BinaryStringPoolBuilder {
  intern(value: string): number
  finish(): BinaryStringPool
}

export function readBinaryString(pool: BinaryStringPool, id: number): string
export function binaryStringEquals(pool: BinaryStringPool, id: number, utf8: Uint8Array): boolean
```

Внутренний поиск builder выполняет собственная типизированная таблица; полный `Map<string, number>` запрещён. В итоговом pool запись хранит смещение и длину UTF-8, а lookup сверяет исходные байты после совпадения xxHash64.

- [ ] **Step 4: Реализовать двоичный кодек переносимых значений**

```ts
export function encodeBinaryValue(
  value: unknown,
  strings: BinaryStringPoolBuilder,
): Uint8Array<ArrayBuffer>

export function decodeBinaryValue(
  bytes: Uint8Array,
  strings: BinaryStringPool,
): unknown
```

Использовать однобайтовые теги для `undefined`, `null`, boolean, безопасного integer, float64, bigint, string-id, array и plain object. Ключи объекта и строковые значения кодировать только идентификаторами глобальной таблицы строк. Сортировать ключи plain object для детерминированных байтов. Отклонять функции, symbol, циклы, нестандартные прототипы и числа вне поддержанного договора.

- [ ] **Step 5: Проверить кодеки и время маленьких тестов**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/stringPool.test.ts metadata/projectState/binary/valueCodec.test.ts --no-isolate`

Expected: PASS; ни один тест не превышает 50 мс в отчёте Vitest.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/binary/stringPool.ts packages/core/metadata/projectState/binary/stringPool.test.ts packages/core/metadata/projectState/binary/valueCodec.ts packages/core/metadata/projectState/binary/valueCodec.test.ts packages/core/metadata/projectState/binary/layouts.ts
git commit -m "feat: :sparkles: добавить двоичные строки и значения"
```

### Task 4: Неизменяемый снимок и его построитель

**Files:**
- Create: `packages/core/metadata/projectState/binary/snapshot.ts`
- Create: `packages/core/metadata/projectState/binary/builder.ts`
- Create: `packages/core/metadata/projectState/binary/builder.test.ts`
- Create: `packages/core/metadata/projectState/binary/readToken.ts`
- Create: `packages/core/metadata/projectState/binary/readToken.test.ts`
- Create: `packages/core/metadata/projectState/binary/testData.ts`
- Modify: `packages/core/metadata/projectState/binary/layouts.ts`
- Modify: `packages/core/metadata/projectState/contracts.ts`
- Modify: `packages/core/metadata/projectState/contracts.test.ts`

**Interfaces:**
- Consumes: формат, string pool, value codec и hash index из Tasks 1–3; предметные `ProjectStateFileUpdate` и `ProjectStateImportFinalFileState`.
- Produces: `ProjectStateSharedBuffers`, `ProjectStateSnapshotView`, `buildProjectStateSnapshot()`, новый `ProjectStateReadToken` без JSON.

- [ ] **Step 1: Написать падающую проверку сборки и каскадного удаления**

```ts
it("строит новый снимок из прежних файлов, замен и удалений", () => {
  const first = buildProjectStateSnapshot({
    replacements: [{ update: yamlUpdate("cf/a.yaml", "cf", "Catalog.A"), hash: 1n }],
    deletions: [],
  })
  const second = buildProjectStateSnapshot({
    base: first,
    replacements: [{ update: yamlUpdate("cf/b.yaml", "cf", "Catalog.B"), hash: 2n }],
    deletions: ["cf/a.yaml"],
  })
  const view = new ProjectStateSnapshotView(second)
  expect(view.filePaths()).toEqual(["cf/b.yaml"])
  expect(view.lookupTarget("cf", "Catalog.A")).toEqual([])
  expect(view.lookupTarget("cf", "Catalog.B")).toHaveLength(1)
})
```

- [ ] **Step 2: Написать падающую проверку одноразового token**

```ts
it("передаёт общие буферы без копирования и захватывается один раз", () => {
  const buffers = buildProjectStateSnapshot({ replacements: [], deletions: [] })
  const token = createBinaryProjectStateReadToken(buffers)
  const claimed = claimBinaryProjectStateReadToken(token)
  expect(claimed.strings).toBe(buffers.strings)
  expect(() => claimBinaryProjectStateReadToken(token)).toThrow(/использован|захвачен/iu)
})
```

- [ ] **Step 3: Подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/builder.test.ts metadata/projectState/binary/readToken.test.ts --no-isolate`

Expected: FAIL с отсутствующими `builder` и `readToken`.

- [ ] **Step 4: Реализовать тип снимка и построитель**

```ts
export interface ProjectStateSharedBuffers {
  readonly header: SharedArrayBuffer
  readonly strings: SharedArrayBuffer
  readonly files: SharedArrayBuffer
  readonly facts: SharedArrayBuffer
  readonly lookups: SharedArrayBuffer
  readonly diagnostics: SharedArrayBuffer
}

export interface ProjectStateSnapshotPatch {
  readonly update: ProjectStateFileUpdate
  readonly hash: bigint
}

export function buildProjectStateSnapshot(input: {
  readonly base?: ProjectStateSharedBuffers
  readonly replacements: readonly ProjectStateSnapshotPatch[]
  readonly deletions: readonly string[]
}): ProjectStateSharedBuffers
```

`builder.ts` выполняет два прохода: сначала считает записи и верхние границы байтов, затем выделяет целевые буферы и заполняет их. Старые записи копируются потоково; проверка замен и удалений использует типизированный индекс путей, а не полный JS `Map`. Все записи фактов содержат `sourceFileId`; поисковые таблицы указывают на одну запись или непрерывный диапазон.

`ProjectStateSnapshotView` предоставляет узкие примитивы чтения, необходимые будущему store и query port: обход файлов, чтение хэша, локальных diagnostics, фактов файла, диапазона по индексу и сравнение ключа.

- [ ] **Step 5: Заменить JSON-токен общими буферами**

До удаления SQLite сохранить временный переходный union, чтобы каждый промежуточный коммит собирался:

```ts
export interface BinaryProjectStateReadToken {
  readonly claim: SharedArrayBuffer
  readonly buffers: ProjectStateSharedBuffers
}

export type ProjectStateReadToken = LegacySqliteProjectStateReadToken | BinaryProjectStateReadToken
```

`LegacySqliteProjectStateReadToken` остаётся прежним брендированным `Uint8Array` только до Task 10. `createBinaryProjectStateReadToken()` выделяет `claim` размером 4 байта. `claimBinaryProjectStateReadToken()` выполняет `Atomics.compareExchange(new Int32Array(claim), 0, 0, 1)` и возвращает те же ссылки на буферы только при первом захвате. Проверка договора запрещает `ArrayBuffer`, лишние поля и несогласованный заголовок.

В `testData.ts` вынести из `storeContract.ts` переиспользуемые конструкторы с точными сигнатурами:

```ts
export function resourceUpdate(projectPath: string, componentPath = "cf"): ProjectStateFileUpdate
export function yamlUpdate(projectPath: string, componentPath: string, canonical: string): ProjectStateFileUpdate
export function richYamlUpdate(projectPath: string, componentPath: string, canonical: string): ProjectStateFileUpdate
```

- [ ] **Step 6: Запустить целевые проверки**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/contracts.test.ts metadata/projectState/binary/builder.test.ts metadata/projectState/binary/readToken.test.ts --no-isolate && pnpm --filter @nkdk/core type-check`

Expected: PASS.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/contracts.ts packages/core/metadata/projectState/contracts.test.ts packages/core/metadata/projectState/binary/snapshot.ts packages/core/metadata/projectState/binary/builder.ts packages/core/metadata/projectState/binary/builder.test.ts packages/core/metadata/projectState/binary/readToken.ts packages/core/metadata/projectState/binary/readToken.test.ts packages/core/metadata/projectState/binary/testData.ts packages/core/metadata/projectState/binary/layouts.ts
git commit -m "feat: :sparkles: собирать снимок состояния в общей памяти"
```

### Task 5: Пакетные запросы двоичного снимка

**Files:**
- Create: `packages/core/metadata/projectState/binary/readSession.ts`
- Create: `packages/core/metadata/projectState/binary/readSession.test.ts`
- Modify: `packages/core/metadata/projectState/readSession.ts`

**Interfaces:**
- Consumes: `ProjectStateSnapshotView`, `claimBinaryProjectStateReadToken()` и существующий `ProjectStateQueryPort`.
- Produces: `createBinaryProjectStateQueryPort()` и `openBinaryProjectStateReadSession()` с прежней предметной семантикой.

- [ ] **Step 1: Перенести уникальные договоры SQLite read session в общий тест**

Расширить `binary/readSession.test.ts` существующими наблюдаемыми случаями из `sqlite/readSession.test.ts`, не копируя перестановки:

```ts
it("соблюдает видимость cf и собственного расширения", () => {
  const session = openSessionWithUpdates([
    richYamlUpdate("cf/base.yaml", "cf", "Catalog.Base"),
    richYamlUpdate("cfe/Цены/own.yaml", "cfe/Цены", "Catalog.Extension"),
    richYamlUpdate("cfe/Скидки/foreign.yaml", "cfe/Скидки", "Catalog.Foreign"),
  ])
  expect(session.resolveTargets([
    lookup("base", "cfe/Цены", "Catalog.Base"),
    lookup("own", "cfe/Цены", "Catalog.Extension"),
    lookup("foreign", "cfe/Цены", "Catalog.Foreign"),
  ]).map(({ status }) => status)).toEqual(["found", "found", "missing"])
})

it("возвращает ambiguous вместо произвольной записи", () => {
  const session = openSessionWithUpdates([
    richYamlUpdate("cf/a.yaml", "cf", "Catalog.Duplicate"),
    richYamlUpdate("cf/b.yaml", "cf", "Catalog.Duplicate"),
  ])
  expect(session.resolveTargets([lookup("duplicate", "cf", "Catalog.Duplicate")]))
    .toEqual([{ requestId: "duplicate", status: "ambiguous" }])
})
```

В этом же тестовом файле определить `openSessionWithUpdates(updates)`: собрать пустой снимок с `updates.map((update, index) => ({ update, hash: BigInt(index + 1) }))`, создать token и открыть binary session. `lookup()` оставить локальным конструктором точного `ProjectStateTargetLookupRequest`; скрытых стендов и моков здесь нет.

Также перенести проверки точных YAML-путей metadata/DataPath-ссылок, prefix-поиска, пагинации, validation status, owner/field/form inputs и поведения закрытого сеанса.

- [ ] **Step 2: Подтвердить падение двоичного read session**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/readSession.test.ts --no-isolate`

Expected: FAIL с отсутствующим `openBinaryProjectStateReadSession`.

- [ ] **Step 3: Реализовать все методы `ProjectStateQueryPort`**

```ts
export function createBinaryProjectStateQueryPort(
  snapshot: ProjectStateSnapshotView,
): ProjectStateQueryPort

export function openBinaryProjectStateReadSession(
  token: ProjectStateReadToken,
): ProjectStateReadSession
```

Для каждого входного массива сохранять порядок `requestId`. Правило видимости оставить прежним: `cf` видит только `cf`, расширение сначала своё, затем `cf`, но не чужое расширение. Неоднозначность определяется количеством видимых источников после проверки полного ключа. Декодировать только записи, входящие в результат запроса; полный раздел в массив объектов не преобразовывать.

`readOwnerRefPage()` и `readComponentTargetPage()` используют числовой курсор, закодированный как строка, и продолжают чтение с позиции массива, а не создают отсортированную копию всего раздела.

- [ ] **Step 4: Запустить проверки read session**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/readSession.test.ts --no-isolate`

Expected: PASS с прежними результатами и порядком.

- [ ] **Step 5: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/readSession.ts packages/core/metadata/projectState/binary/readSession.ts packages/core/metadata/projectState/binary/readSession.test.ts
git commit -m "feat: :sparkles: читать состояние через двоичные индексы"
```

### Task 6: Транзакционный двоичный `ProjectStateStore`

**Files:**
- Create: `packages/core/metadata/projectState/binary/store.ts`
- Create: `packages/core/metadata/projectState/binary/store.test.ts`
- Create: `packages/core/metadata/projectState/binary/testFixture.ts`
- Modify: `packages/core/metadata/projectState/store.ts`
- Modify: `packages/core/metadata/projectState/storeContract.ts`
- Modify: `packages/core/metadata/projectState/dependencyValidation.test.ts`

**Interfaces:**
- Consumes: builder, read token, read session и существующие предметные типы обновлений/import.
- Produces: `createBinaryProjectStateStore()` и `createBinaryProjectStateTestFixture()` как полную реализацию `ProjectStateStore`.

- [ ] **Step 1: Запустить общий договор против новой фабрики и получить падение**

```ts
describe("BinaryProjectStateStore", () => {
  runProjectStateStoreContract(() => createBinaryProjectStateTestFixture())
})
```

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/store.test.ts --no-isolate`

Expected: FAIL с отсутствующей фабрикой.

- [ ] **Step 2: Реализовать транзакцию над неизменяемым снимком**

```ts
export interface BinaryProjectStateStoreOptions {
  readonly initial?: ProjectStateSharedBuffers
  readonly checkpoint?: (buffers: ProjectStateSharedBuffers) => Promise<void>
}

export function createBinaryProjectStateStore(
  options?: BinaryProjectStateStoreOptions,
): ProjectStateStore
```

`beginUpdate()` создаёт draft со ссылкой на текущий снимок. `replaceFiles()`, import-методы и `deleteFiles()` добавляют ограниченные замены в draft. Первое чтение candidate или `commitUpdate()` материализует новый снимок один раз. `rollbackUpdate()` отбрасывает draft. `commitUpdate()` одной заменой ссылки публикует candidate. Локальные diagnostics и dependency validation во время активной транзакции читают candidate, но обычный read token вне неё читает опубликованный снимок.

Удалить `readCompatibility()` из `ProjectStateStore`: совместимость проверяет только двоичный загрузчик по версии `0.4.1`. `createBinaryProjectStateTestFixture()` создаёт store, session factory и очистку без файловой системы; `storeContract.ts` использует экспортированные конструкторы из `binary/testData.ts`, а не дублирует их.

- [ ] **Step 3: Сохранить import-инварианты общего договора**

Проверки должны подтвердить:

```ts
expect(() => store.replaceImportFinalFileState(batchWithChangedIdentity)).toThrow(/identity/iu)
expect(store.readComponentProjection("cfe/Цены").updates).toEqual([neighbor])
expect(openReadSession(store.createReadToken()).resolveTargets(targetRequests))
  .toEqual(expectedTargets)
```

Индекс первого прохода может временно существовать без final hash/local validation. Окончательный файл обязан иметь зарегистрированную identity. Замена или удаление исходного файла каскадно исключает все его факты.

- [ ] **Step 4: Перевести dependency validation на двоичную фикстуру**

В `dependencyValidation.test.ts` заменить `createSqliteProjectStateTestFixture` на `createBinaryProjectStateTestFixture`, не меняя ожидаемые diagnostics. Это подтверждает, что полная dependency validation зависит от `ProjectStateQueryPort`, а не от SQL.

- [ ] **Step 5: Запустить общий договор и тесты хранилища**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/store.test.ts metadata/projectState/dependencyValidation.test.ts --no-isolate`

Expected: PASS.

- [ ] **Step 6: Проверить новые дубли после завершённого слоя**

Run: `pnpm check:duplicates -- --base 0e5403794b0d6694ee2f33d283cf0011478cb96c`

Expected: PASS без новых дублей.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/store.ts packages/core/metadata/projectState/storeContract.ts packages/core/metadata/projectState/dependencyValidation.test.ts packages/core/metadata/projectState/binary/store.ts packages/core/metadata/projectState/binary/store.test.ts packages/core/metadata/projectState/binary/testFixture.ts
git commit -m "feat: :sparkles: добавить двоичное хранилище проекта"
```

### Task 7: Один файл, фоновое сохранение и главный владелец состояния

**Files:**
- Create: `packages/core/metadata/projectState/binary/persistence.ts`
- Create: `packages/core/metadata/projectState/binary/persistence.test.ts`
- Modify: `packages/core/metadata/projectState/writerHandle.ts`
- Modify: `packages/core/metadata/projectState/writerHandle.test.ts`
- Modify: `packages/core/metadata/projectState/refresh.ts`
- Modify: `packages/core/metadata/projectState/refresh.test.ts`
- Modify: `packages/core/metadata/projectState/service.ts`
- Modify: `packages/core/metadata/projectState/service.test.ts`

**Interfaces:**
- Consumes: `ProjectStateSharedBuffers`, бинарный store и `publishFileAtomically()`.
- Produces: `projectStateBinaryPath()`, `loadBinaryProjectState()`, `saveBinaryProjectState()`, in-process `ProjectStateWriterHandle` с последовательным фоновым сохранением.

- [ ] **Step 1: Написать падающий интеграционный тест файла**

```ts
it("записывает все общие буферы одним файлом и загружает их обратно", async () => {
  const tempProjects = trackTempProjectDirs("nkdk-binary-state-")
  const projectDir = tempProjects.create()
  const expected = buildProjectStateSnapshot({
    replacements: [{ update: resourceUpdate("cf/icon.png"), hash: 5n }],
    deletions: [],
  })
  await saveBinaryProjectState(projectDir, expected)
  const actual = await loadBinaryProjectState(projectDir)
  expect(actual).toBeDefined()
  expect(new ProjectStateSnapshotView(actual!).filePaths()).toEqual(["cf/icon.png"])
  expect(basename(projectStateBinaryPath(projectDir))).toBe("project-state.bin")
  await tempProjects.removeAll()
})
```

Добавить в тот же `it.each` случаи другой patch-версии, неверных границ, checksum и оборванного файла; каждый должен удалить файл и вернуть `undefined`.

- [ ] **Step 2: Подтвердить падение persistence test**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/persistence.test.ts --no-isolate`

Expected: FAIL с отсутствующим `persistence`.

- [ ] **Step 3: Реализовать ленивую загрузку и атомарную запись**

```ts
export function projectStateBinaryPath(projectDir: string): string

export async function loadBinaryProjectState(
  projectDir: string,
): Promise<ProjectStateSharedBuffers | undefined>

export async function saveBinaryProjectState(
  projectDir: string,
  buffers: ProjectStateSharedBuffers,
): Promise<void>
```

`saveBinaryProjectState()` вычисляет xxHash64 полезных разделов, формирует финальный заголовок и через `publishFileAtomically()` пишет заголовок и используемые части всех буферов во временный файл. Использовать `FileHandle.writev()` с `Buffer.from(sharedBuffer)`; не объединять разделы в новый полный `Buffer`.

`loadBinaryProjectState()` читает и проверяет заголовок, размеры, заполнение таблиц и checksum, затем читает каждый раздел прямо в отдельный `SharedArrayBuffer`. Несовместимый или повреждённый файл и оставшиеся `.project-state.bin.*.tmp` удаляются как восстанавливаемый кэш.

- [ ] **Step 4: Переписать `ProjectStateWriterHandle` как in-process владельца**

Сохранить имя интерфейса, чтобы не менять оркестрацию, но удалить `Worker`, transport и команды. Новый конструктор:

```ts
export interface CreateProjectStateWriterHandleOptions {
  readonly openStore?: (projectDir: string) => Promise<ProjectStateStore>
  readonly save?: (projectDir: string, buffers: ProjectStateSharedBuffers) => Promise<void>
}

export function createProjectStateWriterHandle(
  options?: CreateProjectStateWriterHandleOptions,
): ProjectStateWriterHandle
```

Production-default `openStore` вызывает `loadBinaryProjectState(projectDir)`, затем `createBinaryProjectStateStore({ initial })`; тесты подставляют полностью внутрипамятный store. Переименовать `commitAndCheckpoint()` в `commitAndScheduleCheckpoint()`. Метод публикует candidate в памяти, ставит сохранение в единственную очередь и сразу возвращает `{ snapshotPath }`. Добавить `flushCheckpoint(): Promise<{ snapshotPath: string }>`: профиль и `close()` через него дожидаются текущего сохранения, обычные операции его не вызывают. `beginUpdate()` сначала ждёт предыдущее сохранение; если оно упало, повторно сохраняет текущий снимок и только затем начинает новое изменение. Отмена до commit отбрасывает draft.

- [ ] **Step 5: Обновить refresh и service без изменения предметного потока**

`refresh.ts` после получения diagnostics и read token вызывает `commitAndScheduleCheckpoint()`. `service.ts` лениво открывает binary store, экспортирует `openProjectStateReadSession = openBinaryProjectStateReadSession`, удаляет `.bin`, временные и старый `.sqlite` при reset и сохраняет существующую последовательность операций одного проекта.

Профиль заменяет `checkpointMs` отдельными `scheduleSaveMs` и `saveBinaryMs`; перед чтением `snapshotBytes` вызывает `flushCheckpoint()`, чтобы значение было точным.

- [ ] **Step 6: Усилить существующие тесты последовательности**

```ts
it("возвращает validation до окончания save, но не начинает следующее изменение", async () => {
  const saving = Promise.withResolvers<void>()
  const events: string[] = []
  const handle = createProjectStateWriterHandle({
    openStore: async () => createBinaryProjectStateTestFixture().store,
    save: async () => { events.push("save"); await saving.promise },
  })
  await handle.beginUpdate("/project")
  await handle.writeBatch(encodeProjectStateFileUpdateBatch(
    createProjectStateFileUpdateBatch([{ update: resourceUpdate("cf/a.bin"), hash: 1n }]),
  ))
  await handle.commitAndScheduleCheckpoint()
  const next = handle.beginUpdate("/project").then(() => events.push("next"))
  await Promise.resolve()
  expect(events).toEqual(["save"])
  saving.resolve()
  await next
  expect(events).toEqual(["save", "next"])
})
```

Существующие service tests должны сохранить договоры switch-project, rebuild, reset, import lease, close и сохранение прежнего состояния при техническом сбое. Все ожидаемые пути заменить на `project-state.bin`.

- [ ] **Step 7: Запустить persistence/handle/service тесты**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/persistence.test.ts metadata/projectState/writerHandle.test.ts metadata/projectState/refresh.test.ts metadata/projectState/service.test.ts --no-isolate`

Expected: PASS; небольшие интеграционные тесты не превышают 50 мс каждый.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/binary/persistence.ts packages/core/metadata/projectState/binary/persistence.test.ts packages/core/metadata/projectState/writerHandle.ts packages/core/metadata/projectState/writerHandle.test.ts packages/core/metadata/projectState/refresh.ts packages/core/metadata/projectState/refresh.test.ts packages/core/metadata/projectState/service.ts packages/core/metadata/projectState/service.test.ts
git commit -m "feat: :sparkles: сохранять двоичное состояние проекта"
```

### Task 8: Двоичные вклады validation worker

**Files:**
- Create: `packages/core/metadata/projectState/binary/contribution.ts`
- Create: `packages/core/metadata/projectState/binary/contribution.test.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/store.ts`
- Modify: `packages/core/metadata/projectState/binary/builder.ts`
- Modify: `packages/core/metadata/projectState/binary/store.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`

**Interfaces:**
- Consumes: логический `ProjectStateFileUpdateBatch`, string/value codec и binary builder.
- Produces: `ProjectStateEncodedFileUpdateBatch`, `encodeProjectStateFileUpdateBatch()`, `openProjectStateFileUpdateBatch()`; store принимает двоичный вклад напрямую.

- [ ] **Step 1: Написать падающий тест двоичного вклада**

```ts
it("читает сведения файла прямо из переданного ArrayBuffer", () => {
  const encoded = encodeProjectStateFileUpdateBatch(
    createProjectStateFileUpdateBatch([{
      update: richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"),
      hash: 9n,
    }]),
  )
  const view = openProjectStateFileUpdateBatch(encoded)
  expect(view.fileCount).toBe(1)
  expect(view.projectPath(0)).toBe("cf/Товары.yaml")
  expect(view.hash(0)).toBe(9n)
  expect(view.references(0)).toEqual([{ kind: "object", canonical: "Catalog.Товары" }])
})
```

- [ ] **Step 2: Подтвердить падение contribution test**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/contribution.test.ts --no-isolate`

Expected: FAIL с отсутствующим `contribution`.

- [ ] **Step 3: Реализовать локальный двоичный вклад**

```ts
export interface ProjectStateEncodedFileUpdateBatch {
  readonly bytes: Uint8Array<ArrayBuffer>
}

export function encodeProjectStateFileUpdateBatch(
  batch: ProjectStateFileUpdateBatch,
): ProjectStateEncodedFileUpdateBatch

export function openProjectStateFileUpdateBatch(
  batch: ProjectStateEncodedFileUpdateBatch,
): ProjectStateFileUpdateBatchView
```

Вклад содержит собственную локальную таблицу строк, записи файлов, хэши и диапазоны фактов. Builder читает view и при слиянии переназначает локальные string-id в глобальный pool, не вызывая полного `decode()` вклада. Проверка границы принимает только zero-offset `Uint8Array<ArrayBuffer>` без лишних полей.

- [ ] **Step 4: Перевести store и producer на encoded batch**

Изменить `ProjectStateStore.replaceFiles()` и `ProjectStateWriterHandle.writeBatch()` на `ProjectStateEncodedFileUpdateBatch`. Внутри binary store передать view прямо draft builder. Логические DTO оставить только внутри worker и узких тестовых helpers.

- [ ] **Step 5: Передать владение из Piscina worker**

В `preparedYamlProjectWorker.ts` кодировать завершённые file batches перед возвратом и объявлять все `bytes.buffer`:

```ts
export function createValidationFirstPassTransferable(result: TransferableValidationWorkerResult) {
  return {
    get [transferableSymbol]() {
      return result.fileUpdateBatches.map(({ bytes }) => bytes.buffer)
    },
    get [valueSymbol]() {
      return result
    },
  }
}
```

`movableValidationResult()` продолжает использовать Piscina `move()`. В transfer list не должно быть ни одного `SharedArrayBuffer`.

- [ ] **Step 6: Запустить worker, pool и store проверки**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/contribution.test.ts metadata/project/preparedYamlProjectWorker.test.ts metadata/project/preparedYamlProject.test.ts metadata/projectState/binary/store.test.ts --no-isolate`

Expected: PASS; тест отчуждения подтверждает `encoded.bytes.byteLength === 0` после `structuredClone(..., { transfer })`.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/binary/contribution.ts packages/core/metadata/projectState/binary/contribution.test.ts packages/core/metadata/projectState/binary/builder.ts packages/core/metadata/projectState/binary/store.ts packages/core/metadata/projectState/fileUpdate.ts packages/core/metadata/projectState/fileUpdateValidation.ts packages/core/metadata/projectState/store.ts packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/project/preparedYamlProjectWorker.test.ts packages/core/metadata/project/preparedYamlProjectWorkerPool.ts
git commit -m "perf: :zap: передавать двоичные вклады validation"
```

### Task 9: Временный индекс и двоичные результаты import

**Files:**
- Modify: `packages/core/metadata/projectState/binary/contribution.ts`
- Modify: `packages/core/metadata/projectState/binary/contribution.test.ts`
- Modify: `packages/core/metadata/projectState/importSession.ts`
- Modify: `packages/core/metadata/projectState/importSession.test.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/tests/xmlImportWorkerTestPool.ts`

**Interfaces:**
- Consumes: binary contribution codec, immutable store snapshots and one-use read tokens.
- Produces: `ProjectStateEncodedImportIndexBatch`, `ProjectStateEncodedImportFinalBatch`; один временный read-only снимок после первого прохода и один окончательный commit.

- [ ] **Step 1: Написать падающий тест фаз import session**

```ts
it("не сохраняет рабочий индекс и собирает final state одной транзакцией", async () => {
  const saved: ProjectStateSharedBuffers[] = []
  const writer = createProjectStateWriterHandle({
    openStore: async () => createBinaryProjectStateTestFixture().store,
    save: async (_projectDir, buffers) => { saved.push(buffers) },
  })
  const contribution = indexContribution("cf/a.yaml", "Товары")
  const session = await createProjectStateImportSession({
    projectDir: "/project",
    workerCount: 1,
    output: { componentPaths: ["cf"] },
    writer,
    async publish() {},
    async discard() {},
  })
  await session.writeFirstPassBatch(encodeImportIndexBatch([contribution]))
  const firstToken = await session.commitWorkingIndex()
  const secondToken = await session.createReadToken()
  expect(firstToken.buffers.files).toBe(secondToken.buffers.files)
  await writer.flushCheckpoint()
  expect(saved).toHaveLength(0)
  await session.writeFinalFileState(encodeImportFinalBatch(finalBatch("cf/a.yaml", 4n)))
  await session.finalize()
  await writer.flushCheckpoint()
  expect(saved).toHaveLength(1)
  await writer.close()
})
```

Использовать уже существующие в `importSession.test.ts` конструкторы `indexContribution()` и `finalBatch()`; добавить только явные binary encoders. Не вводить отдельный скрытый стенд.

- [ ] **Step 2: Подтвердить падение import tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/importSession.test.ts metadata/importFromXml/worker.test.ts --no-isolate`

Expected: FAIL, потому что import ещё возвращает объектные вклады и выполняет commit для отдельных final batches.

- [ ] **Step 3: Добавить два формата import-вкладов**

```ts
export interface ProjectStateEncodedImportIndexBatch {
  readonly bytes: Uint8Array<ArrayBuffer>
}

export interface ProjectStateEncodedImportFinalBatch {
  readonly bytes: Uint8Array<ArrayBuffer>
}
```

Index batch содержит identity и только сведения основного индекса. Final batch содержит identity, точный хэш окончательных байтов, локальные diagnostics, pending references/checks и file dependencies. Оба формата имеют локальные таблицы строк и читаются builder без полного декодирования.

- [ ] **Step 4: Сделать рабочий индекс неизменяемым до конца второго прохода**

`commitWorkingIndex()` должен:

1. дождаться first-pass writes;
2. материализовать и commit рабочий снимок без сохранения на диск;
3. сохранить ссылку на его буферы;
4. сразу открыть одну final-транзакцию;
5. вернуть одноразовый token рабочего снимка.

`createReadToken()` создаёт новый claim-SAB над теми же рабочими буферами. Все final batches записываются в одну открытую final-транзакцию. `finalize()` читает локальные diagnostics, выполняет полную dependency validation, публикует окончательный снимок и только один раз вызывает `commitAndScheduleCheckpoint()`.

- [ ] **Step 5: Перевести import worker на `move()` всех двоичных результатов**

```ts
export function createFirstPassTransferable(result: ImportFirstPassResult) {
  return {
    get [transferableSymbol]() {
      return [
        ...result.indexBatches.map(({ bytes }) => bytes.buffer),
        ...result.finalStateBatches.map(({ bytes }) => bytes.buffer),
      ]
    },
    get [valueSymbol]() {
      return result
    },
  }
}
```

Готовые YAML по-прежнему записываются сразу в первом проходе; их хэш берётся из записываемых байтов. Второй проход записывает только YAML с отложенными значениями и не перечитывает их с диска для хэширования или локальной validation.

- [ ] **Step 6: Запустить import и маленький интеграционный набор**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/importSession.test.ts metadata/importFromXml/worker.test.ts metadata/importFromXml/workerPool.test.ts --no-isolate`

Expected: PASS; тест transfer list содержит все обычные `ArrayBuffer` вкладов и ни одного `SharedArrayBuffer`.

- [ ] **Step 7: Проверить новые дубли после завершённого слоя**

Run: `pnpm check:duplicates -- --base 0e5403794b0d6694ee2f33d283cf0011478cb96c`

Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/binary/contribution.ts packages/core/metadata/projectState/binary/contribution.test.ts packages/core/metadata/projectState/importSession.ts packages/core/metadata/projectState/importSession.test.ts packages/core/metadata/importFromXml/types.ts packages/core/metadata/importFromXml/worker.ts packages/core/metadata/importFromXml/worker.test.ts packages/core/metadata/importFromXml/workerPool.ts packages/core/tests/xmlImportWorkerTestPool.ts
git commit -m "perf: :zap: собирать import через двоичные вклады"
```

### Task 10: Удаление SQLite и фиксация архитектурной границы

**Files:**
- Delete: `packages/core/metadata/projectState/sqlite/codec.ts`
- Delete: `packages/core/metadata/projectState/sqlite/fieldEntry.ts`
- Delete: `packages/core/metadata/projectState/sqlite/ownerFacts.ts`
- Delete: `packages/core/metadata/projectState/sqlite/persistence.ts`
- Delete: `packages/core/metadata/projectState/sqlite/persistence.test.ts`
- Delete: `packages/core/metadata/projectState/sqlite/readSession.ts`
- Delete: `packages/core/metadata/projectState/sqlite/readSession.test.ts`
- Delete: `packages/core/metadata/projectState/sqlite/readSession.testWorker.ts`
- Delete: `packages/core/metadata/projectState/sqlite/readToken.ts`
- Delete: `packages/core/metadata/projectState/sqlite/schema.ts`
- Delete: `packages/core/metadata/projectState/sqlite/store.ts`
- Delete: `packages/core/metadata/projectState/sqlite/store.test.ts`
- Delete: `packages/core/metadata/projectState/sqlite/testFixture.ts`
- Delete: `packages/core/metadata/projectState/compatibility.ts`
- Delete: `packages/core/metadata/projectState/compatibility.test.ts`
- Delete: `packages/core/metadata/projectState/compatibilityHandler.test.ts`
- Delete: `packages/core/metadata/orchestration/property/typeRuleCompatibilityIdentity.ts`
- Delete: `packages/core/scripts/rulesSourceFingerprint.mjs`
- Delete: `packages/core/scripts/rulesSourceFingerprint.test.ts`
- Delete: `packages/core/metadata/projectState/writerWorker.ts`
- Delete: `packages/core/metadata/projectState/writerProtocol.ts`
- Delete: `packages/core/metadata/projectState/tests/mockWriterTransport.ts`
- Delete: `packages/core/metadata/projectState/tests/mockWriterTransport.test.ts`
- Modify: `packages/core/metadata/projectState/index.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/register.ts`
- Modify: `packages/core/metadata/validation/registerValidationMetadata.ts`
- Modify: `packages/core/tests/xmlImportWorkerTestPool.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/scripts/build.mjs`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `packages/mcp/src/server.test.ts`
- Modify: `.agents/architecture.md`

**Interfaces:**
- Consumes: полностью переключённые binary store/read session/persistence из Tasks 1–9.
- Produces: единственную production-реализацию состояния без `node:sqlite`, fingerprint и отдельного writer worker.

- [ ] **Step 1: Усилить архитектурный тест до удаления файлов**

Заменить SQLite-правило в `importBoundaries.test.ts` двумя проверками:

```ts
it("состояние проекта не импортирует node:sqlite", () => {
  const offenders = listTypeScriptFiles(join(METADATA_DIR, "projectState"))
    .filter((filePath) => !filePath.endsWith(".test.ts"))
    .filter((filePath) => readSource(filePath).includes("node:sqlite"))
  expect(offenders).toEqual([])
})

it("только binary-адаптер знает structurae и физический формат", () => {
  expect(binaryBoundaryOffenders).toEqual([])
})
```

`binaryBoundaryOffenders` должен запрещать импорты `structurae` вне `metadata/projectState/binary` и импорты `binary/layouts`, `binary/hashIndex`, `binary/stringPool` из orchestration, validation, import и sync.

- [ ] **Step 2: Подтвердить падение до удаления SQLite**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts --no-isolate`

Expected: FAIL со списком SQLite-файлов.

- [ ] **Step 3: Удалить старую реализацию и совместимость**

Удалить перечисленные файлы. Убрать exports `ProjectStateCompatibility`, `createProjectStateCompatibility`, writer protocol и SQLite fixtures из `metadata/projectState/index.ts` и `packages/core/index.ts`. Удалить вызовы `markRegisteredTypeRulesAsCoreForCompatibility()` и `markTypeRuleAsCoreForCompatibility()` из регистрации: после отказа от fingerprint они не имеют поведения. Тестовый import service должен создавать обычный in-process binary handle без compatibility.

Из build-скриптов удалить entry point `projectStateWriterWorker.ts`, вычисление и define `__NKDK_RULES_SOURCE_FINGERPRINT__`; `server.test.ts` больше не ожидает `dist/bin/projectStateWriterWorker.js`. Structurae остаётся внешней runtime-зависимостью core и MCP bundle.

После удаления SQLite заменить переходный union из Task 4: публичный `ProjectStateReadToken` становится псевдонимом `BinaryProjectStateReadToken`, а legacy-бренд удаляется. На этом шаге `rg -n "LegacySqliteProjectStateReadToken" packages/core` обязан вернуть пустой результат.

- [ ] **Step 4: Обновить архитектуру проекта**

В `.agents/architecture.md` заменить SQLite-описание следующими обязательными положениями:

- `.nkdk/cache/project-state.bin`, версия `0.4.1`;
- один файл и несколько `SharedArrayBuffer`;
- structurae-view плюс собственные хэш-индексы с пределом 80%;
- главный процесс строит и заменяет снимок, worker только читают и возвращают binary contributions;
- асинхронное последовательное сохранение;
- временный read-only индекс import не сохраняется;
- одинаковая схема Б1–Б6 для validation, import, полной sync, поиска и двух проходов переименования;
- `ignoreValidationErrors` не пропускает проверки;
- частичная sync пока отсутствует.

Сохранить ранее согласованную вертикальную компоновку трёх колонок Mermaid и одинаковые названия общих блоков.

- [ ] **Step 5: Запустить архитектурные и связанные тесты**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts metadata/projectState metadata/importFromXml/worker.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts metadata/operations/findMetadataReferences.test.ts metadata/operations/renameItem.test.ts --no-isolate`

Expected: PASS; validation, полная sync и поиск вызывают актуализацию один раз, переименование — до и после изменения, а `ignoreValidationErrors` разрешает продолжение только после выполненной проверки. `rg -n "node:sqlite|project-state\.sqlite|createSqliteProjectState|RULES_SOURCE_FINGERPRINT|typeRuleCompatibilityIdentity" packages/core packages/mcp` не возвращает production-вхождений.

- [ ] **Step 6: Проверить типы и новые дубли**

Run: `pnpm type-check`

Expected: PASS.

Run: `pnpm check:duplicates -- --base 0e5403794b0d6694ee2f33d283cf0011478cb96c`

Expected: PASS.

- [ ] **Step 7: Зафиксировать замену реализации**

```bash
git add packages/core packages/mcp .agents/architecture.md
git commit -m "refactor: :recycle: удалить SQLite из состояния проекта"
```

### Task 11: Измерительный стенд и итоговая проверка

**Files:**
- Create: `packages/core/scripts/measure-binary-project-state.ts`
- Create: `packages/core/scripts/measure-binary-project-state-worker.ts`
- Create: `packages/core/scripts/measure-binary-project-state.test.ts`
- Modify: `packages/core/package.json`
- Modify: `.agents/skills/validation-profile/validation-profile.mjs`

**Interfaces:**
- Consumes: готовый `.nkdk/cache/project-state.bin`, binary persistence/read session и compiled standalone validation.
- Produces: отдельный отчёт чтения, записи и миллиона поисков; точный validation profile с фоновым сохранением.

- [ ] **Step 1: Написать быстрый тест аргументов измерительного скрипта**

Вынести чистый `parseMeasureBinaryProjectStateArgs()` и проверить только разбор, не создавая миллион записей:

```ts
it("разбирает каталог, число поисков и число worker", () => {
  expect(parseMeasureBinaryProjectStateArgs([
    "/tmp/project",
    "--lookups", "1000000",
    "--workers", "4",
  ])).toEqual({ projectDir: "/tmp/project", lookups: 1_000_000, workers: 4 })
})
```

Run: `pnpm --filter @nkdk/core exec vitest run scripts/measure-binary-project-state.test.ts --no-isolate`

Expected: FAIL до появления parser и PASS после его добавления. Создать рядом `packages/core/scripts/measure-binary-project-state.test.ts`.

- [ ] **Step 2: Реализовать отдельный измерительный скрипт**

Добавить script:

```json
{
  "measure:project-state-binary": "tsx scripts/measure-binary-project-state.ts"
}
```

Скрипт обязан:

1. измерить чтение существующего `.bin` через `loadBinaryProjectState()`;
2. записать те же общие буферы во временный каталог через `saveBinaryProjectState()` и измерить запись;
3. получить существующие target-ключи из снимка;
4. выполнить ровно заданное число поисков, где 90% ключей присутствуют и 10% отсутствуют;
5. повторить поиск с одним и четырьмя worker, передавая только read token с `SharedArrayBuffer`;
6. вывести JSON с секундами, RSS, размером файла и заполнением каждой таблицы;
7. удалить только свой временный каталог в `finally`.

`measure-binary-project-state-worker.ts` открывает `ProjectStateReadSession`, выполняет свою непересекающуюся часть запросов и возвращает только счётчики найденных/отсутствующих результатов.

- [ ] **Step 3: Актуализировать validation-profile под фоновое сохранение**

Runner должен перед завершением каждого измеряемого вызова дождаться доступного через профиль события окончания save и только затем читать `snapshotBytes`. Имена фаз заменить с SQL/checkpoint на `loadBinary`, `processFiles`, `buildBuffers`, `dependencyValidation`, `saveBinary`; вычисление diagnostics digest не менять.

- [ ] **Step 4: Запустить тест скрипта и зафиксировать измерительный слой**

Run: `pnpm --filter @nkdk/core exec vitest run scripts/measure-binary-project-state.test.ts --no-isolate && pnpm --filter @nkdk/core type-check`

Expected: PASS.

```bash
git add packages/core/package.json packages/core/scripts/measure-binary-project-state.ts packages/core/scripts/measure-binary-project-state-worker.ts packages/core/scripts/measure-binary-project-state.test.ts .agents/skills/validation-profile/validation-profile.mjs
git commit -m "perf: :zap: измерять двоичное состояние проекта"
```

- [ ] **Step 5: Проверить import и полную sync на компактной конфигурации**

Сначала убедиться, что рабочее дерево чистое, затем выполнить:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/all \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: import и полная sync завершаются; скрипт сообщает `Round-trip чистый: диффов нет`. Если есть XML diff, остановить завершение задачи и разобрать его как регрессию до итоговых проверок.

- [ ] **Step 6: Выполнить cold/warm compiled standalone validation с пределом 115 секунд**

```bash
rm -rf /private/tmp/nkdk-binary-validation-project
mkdir -p /private/tmp/nkdk-binary-validation-project
rsync -a --exclude .nkdk /Users/nikita/git/nkdk-yaml/ /private/tmp/nkdk-binary-validation-project/
pnpm --filter @nkdk/core build
/opt/homebrew/bin/timeout 115s node .agents/skills/validation-profile/validation-profile.mjs /private/tmp/nkdk-binary-validation-project --runs 2 --timing --json
```

Expected: cold и warm diagnostics digest совпадают; warm разбирает 0 неизменённых YAML; cold завершается до внешнего предела, что подтверждает бюджет менее 2 минут. Зафиксировать из JSON времена `processFiles`, `buildBuffers`, `dependencyValidation`, `saveBinary`, Peak RSS и размер `.bin`, но не коммитить отчёт.

- [ ] **Step 7: Измерить фактический файл и миллион поисков**

Run: `pnpm --filter @nkdk/core measure:project-state-binary -- /private/tmp/nkdk-binary-validation-project --lookups 1000000 --workers 1`

Run: `pnpm --filter @nkdk/core measure:project-state-binary -- /private/tmp/nkdk-binary-validation-project --lookups 1000000 --workers 4`

Expected: отчёт содержит секунды чтения, полной записи и поиска; заполнение каждой таблицы не выше `0.8`; найдено ровно 900000 и отсутствует ровно 100000 запросов.

- [ ] **Step 8: Запустить итоговые статические и полные проверки один раз**

Run: `pnpm check:duplicates -- --base 0e5403794b0d6694ee2f33d283cf0011478cb96c`

Expected: PASS.

Run: `pnpm type-check`

Expected: PASS.

Run: `pnpm test`

Expected: PASS во всех `packages/*`; mutation testing не запускается.
