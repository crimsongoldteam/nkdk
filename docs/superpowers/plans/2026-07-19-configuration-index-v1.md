# Configuration Index 1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать строгий двоичный файл индекса конфигурации версии 1.0, его проверку, атомарную запись и временный формат передачи фрагментов от worker.

**Architecture:** Новый модуль `metadata/configurationIndex` отделяет логическую модель индекса от физического кодека. Кодек нормализует логические записи, строит общий пул строк и семь обязательных секций, а читатель выполняет проверки в нормативном порядке. Файловый слой хэширует только файлы Проекта, найденные существующими правилами, и атомарно заменяет `.nkdk/configuration-index/default.bin` после полной проверки временного файла.

**Tech Stack:** TypeScript 6, Node.js 26 `Buffer`/`fs.promises`, `@node-rs/xxhash`, Vitest 4.

## Global Constraints

- Нормативный источник формата: `.agents/configuration-index-format/v1_0.md`.
- Первая реализация допускает один индекс: `.nkdk/configuration-index/default.bin`, `baseId = "default"`.
- `baseFingerprint` и `configurationVersion` либо оба пусты, либо оба непусты; import из готовой XML-выгрузки записывает оба пустыми.
- Файл содержит семь обязательных секций: `BINDING`, `STRINGS`, `PROJECT_FILES`, `IDENTITIES`, `XML_ORDERS`, `XML_NODES`, `XML_VALUES`.
- Формат не хранит исходные XML-файлы, `XML_REFERENCE_RAW` и порядок коллекций, представленный в Проекте.
- Контрольные суммы — XXH3-128 с seed `0`; хэши файлов — XXH3-64 с seed `0`.
- Индекс, созданный другой версией NKDK, не используется для sync и требует повторного import.
- Существующий индекс изменяется только атомарной заменой после полной проверки нового файла.
- `.nkdk/` не входит в обнаружение и хэширование файлов Проекта и не отслеживается Git.
- Существующие XML-фикстуры не изменять.

---

## File Structure

- `packages/core/metadata/configurationIndex/types.ts` — логическая модель индекса и фрагментов worker.
- `packages/core/metadata/configurationIndex/logicalAddress.ts` — единый builder `uid`, перенесённый из `reference-order-spec`.
- `packages/core/metadata/configurationIndex/hash.ts` — XXH3-64/128 и представление 128-битной суммы в файле.
- `packages/core/metadata/configurationIndex/stringPool.ts` — сортированный UTF-8 пул строк и `stringId`.
- `packages/core/metadata/configurationIndex/encode.ts` — нормализация и запись контейнера 1.0.
- `packages/core/metadata/configurationIndex/decode.ts` — полная структурная проверка и чтение контейнера 1.0.
- `packages/core/metadata/configurationIndex/fragment.ts` — внутренний передаваемый `ArrayBuffer` worker, не являющийся хранимым форматом.
- `packages/core/metadata/configurationIndex/projectFiles.ts` — rule-guided обнаружение и хэширование файлов Проекта.
- `packages/core/metadata/configurationIndex/fileIO.ts` — путь `default.bin`, чтение и атомарная запись.
- `packages/core/metadata/configurationIndex/index.ts` — публичные экспорты модуля.
- `packages/core/version.ts` — версия производителя, внедряемая сборкой.

### Task 1: Логическая модель и единый `uid`

**Files:**
- Create: `packages/core/metadata/configurationIndex/types.ts`
- Create: `packages/core/metadata/configurationIndex/logicalAddress.ts`
- Create: `packages/core/metadata/configurationIndex/logicalAddress.test.ts`
- Create: `packages/core/metadata/configurationIndex/index.ts`
- Create: `packages/core/version.ts`
- Create: `packages/core/version.test.ts`

**Interfaces:**
- Produces: `ConfigurationIndexData`, `ConfigurationIndexFragment`, `ConfigurationIdentity`, `ConfigurationXmlNode`, `ConfigurationXmlValue`.
- Produces: `configurationUid()`, `metadataItemUid()`, `childUid()`, `indexedUid()`.
- Produces: `NKDK_CORE_VERSION` with a deterministic test fallback.

- [ ] **Step 1: Write the failing `uid` tests**

```ts
import { describe, expect, it } from "vitest"
import { childUid, configurationUid, indexedUid, metadataItemUid } from "./logicalAddress"

describe("configuration index logical address", () => {
  it("builds semantic addresses used by reference-order-spec", () => {
    expect(configurationUid()).toBe("Конфигурация")
    expect(metadataItemUid("Документ", "ПоступлениеТоваровУслуг")).toBe("Документ.ПоступлениеТоваровУслуг")
    expect(childUid("Документ.ПоступлениеТоваровУслуг", "Форма", "ФормаДокумента")).toBe(
      "Документ.ПоступлениеТоваровУслуг.Форма.ФормаДокумента"
    )
    expect(indexedUid("Документ.ПоступлениеТоваровУслуг.Отбор", "Элемент", 0)).toBe(
      "Документ.ПоступлениеТоваровУслуг.Отбор.Элемент[0]"
    )
  })

  it("rejects empty segments and invalid indexes", () => {
    expect(() => metadataItemUid("", "Товары")).toThrow("Пустой сегмент logicalAddress")
    expect(() => childUid("Справочник.Товары", "Реквизит", "")).toThrow("Пустой сегмент logicalAddress")
    expect(() => indexedUid("Справочник.Товары", "Элемент", -1)).toThrow("Некорректный индекс logicalAddress")
  })
})
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/logicalAddress.test.ts`

Expected: FAIL because `./logicalAddress` does not exist.

- [ ] **Step 3: Add the exact logical model**

Create `packages/core/version.ts` first:

```ts
declare const __NKDK_CORE_VERSION__: string | undefined

export const NKDK_CORE_VERSION =
  typeof __NKDK_CORE_VERSION__ === "string" && __NKDK_CORE_VERSION__.length > 0
    ? __NKDK_CORE_VERSION__
    : "0.0.0-dev"
```

Add `version.test.ts` asserting the fallback is `0.0.0-dev`, then add the logical model:

```ts
export interface ConfigurationIndexBinding {
  indexGeneration: bigint
  producerVersion: string
  baseId: string
  baseFingerprint: Uint8Array
  configurationVersion: Uint8Array
}

export interface ConfigurationProjectFile {
  projectPath: string
  contentHash: bigint
}

export type ConfigurationIdentity =
  | { logicalAddress: string; kind: "uuid"; value: string }
  | { logicalAddress: string; kind: "xmlId" | "xmlName"; value: string }

export interface ConfigurationXmlNode {
  logicalAddress: string
  order?: readonly string[]
  aliases?: Readonly<Record<string, string>>
  present?: readonly string[]
}

export interface ConfigurationXmlValue {
  logicalAddress: string
  xsiNil?: true
  explicitEmpty?: true
  xsiType?: string
  xmlText?: string
  xmlPrefix?: string
  userSettingsId?: string
}

export interface ConfigurationIndexData {
  binding: ConfigurationIndexBinding
  projectFiles: readonly ConfigurationProjectFile[]
  identities: readonly ConfigurationIdentity[]
  xmlNodes: readonly ConfigurationXmlNode[]
  xmlValues: readonly ConfigurationXmlValue[]
}

export interface ConfigurationIndexFragment {
  targetProjectPath: string
  identities: readonly ConfigurationIdentity[]
  xmlNodes: readonly ConfigurationXmlNode[]
  xmlValues: readonly ConfigurationXmlValue[]
}
```

- [ ] **Step 4: Add the centralized builder**

```ts
export function configurationUid(): string {
  return "Конфигурация"
}

export function metadataItemUid(kind: string, name: string): string {
  return `${segment(kind)}.${segment(name)}`
}

export function childUid(parent: string, kind: string, name: string): string {
  return `${address(parent)}.${segment(kind)}.${segment(name)}`
}

export function indexedUid(parent: string, kind: string, index: number): string {
  if (!Number.isSafeInteger(index) || index < 0) throw new Error("Некорректный индекс logicalAddress")
  return `${address(parent)}.${segment(kind)}[${index}]`
}

function address(value: string): string {
  if (value.length === 0) throw new Error("Пустой logicalAddress")
  return value
}

function segment(value: string): string {
  if (value.length === 0) throw new Error("Пустой сегмент logicalAddress")
  return value
}
```

Export the types and builders from `configurationIndex/index.ts`.

- [ ] **Step 5: Run the focused tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/logicalAddress.test.ts version.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/configurationIndex packages/core/version.ts packages/core/version.test.ts
git commit -m "feat: :sparkles: добавить модель индекса конфигурации"
```

### Task 2: XXH3 и канонический пул строк

**Files:**
- Create: `packages/core/metadata/configurationIndex/hash.ts`
- Create: `packages/core/metadata/configurationIndex/hash.test.ts`
- Create: `packages/core/metadata/configurationIndex/stringPool.ts`
- Create: `packages/core/metadata/configurationIndex/stringPool.test.ts`

**Interfaces:**
- Produces: `hashFileBytes(bytes): bigint`.
- Produces: `hashSection(bytes): { low: bigint; high: bigint }` and `writeHash128(buffer, offset, hash)`.
- Produces: `createStringPool(strings): { strings: string[]; id(value): number }`.

- [ ] **Step 1: Write failing hash representation tests**

```ts
import { xxh3 } from "@node-rs/xxhash"
import { describe, expect, it } from "vitest"
import { hashFileBytes, hashSection, writeHash128 } from "./hash"

describe("configuration index hashes", () => {
  it("uses XXH3-64 for project files", () => {
    const bytes = Buffer.from("Привет", "utf8")
    expect(hashFileBytes(bytes)).toBe(xxh3.xxh64(bytes))
  })

  it("writes XXH3-128 as low u64 followed by high u64", () => {
    const hash = hashSection(Buffer.from("section"))
    const buffer = Buffer.alloc(16)
    writeHash128(buffer, 0, hash)
    expect(buffer.readBigUInt64LE(0)).toBe(hash.low)
    expect(buffer.readBigUInt64LE(8)).toBe(hash.high)
  })
})
```

- [ ] **Step 2: Write failing byte-order string pool tests**

```ts
import { describe, expect, it } from "vitest"
import { createStringPool } from "./stringPool"

describe("configuration index string pool", () => {
  it("deduplicates and sorts by raw UTF-8 bytes", () => {
    const pool = createStringPool(["Я", "A", "Б", "A"])
    const expected = ["Я", "A", "Б"].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
    expect(pool.strings).toEqual(expected)
    expect(pool.id("A")).toBe(expected.indexOf("A") + 1)
  })

  it("rejects missing and NUL-containing strings", () => {
    const pool = createStringPool(["known"])
    expect(() => pool.id("missing")).toThrow("Строка отсутствует в STRINGS")
    expect(() => createStringPool(["bad\0value"])).toThrow("U+0000")
  })
})
```

- [ ] **Step 3: Run both tests and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/hash.test.ts metadata/configurationIndex/stringPool.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 4: Implement XXH3 helpers**

```ts
import { xxh3 } from "@node-rs/xxhash"

const U64_MASK = (1n << 64n) - 1n

export interface Hash128 {
  low: bigint
  high: bigint
}

export function hashFileBytes(bytes: Uint8Array): bigint {
  return xxh3.xxh64(bytes)
}

export function hashSection(bytes: Uint8Array): Hash128 {
  const value = xxh3.xxh128(bytes)
  return { low: value & U64_MASK, high: value >> 64n }
}

export function writeHash128(buffer: Buffer, offset: number, hash: Hash128): void {
  buffer.writeBigUInt64LE(hash.low, offset)
  buffer.writeBigUInt64LE(hash.high, offset + 8)
}
```

- [ ] **Step 5: Implement the UTF-8 pool**

```ts
export interface ConfigurationIndexStringPool {
  strings: string[]
  id(value: string): number
}

export function createStringPool(values: Iterable<string>): ConfigurationIndexStringPool {
  const unique = new Set<string>()
  for (const value of values) {
    if (value.includes("\0")) throw new Error("Строка STRINGS содержит U+0000")
    unique.add(value)
  }
  const strings = [...unique].sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")))
  const ids = new Map(strings.map((value, index) => [value, index + 1]))
  return {
    strings,
    id(value) {
      const id = ids.get(value)
      if (id === undefined) throw new Error(`Строка отсутствует в STRINGS: ${value}`)
      return id
    },
  }
}
```

- [ ] **Step 6: Run the tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/hash.test.ts metadata/configurationIndex/stringPool.test.ts`

Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/configurationIndex/hash.ts packages/core/metadata/configurationIndex/hash.test.ts packages/core/metadata/configurationIndex/stringPool.ts packages/core/metadata/configurationIndex/stringPool.test.ts
git commit -m "feat: :sparkles: добавить примитивы двоичного индекса"
```

### Task 3: Кодирование всех семи секций

**Files:**
- Create: `packages/core/metadata/configurationIndex/encode.ts`
- Create: `packages/core/metadata/configurationIndex/encode.test.ts`
- Modify: `packages/core/metadata/configurationIndex/index.ts`

**Interfaces:**
- Consumes: `ConfigurationIndexData`, `createStringPool`, `hashSection`.
- Produces: `encodeConfigurationIndex(data: ConfigurationIndexData): Buffer`.

- [ ] **Step 1: Write a failing deterministic encoder test**

```ts
import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "./encode"
import type { ConfigurationIndexData } from "./types"

const sample: ConfigurationIndexData = {
  binding: {
    indexGeneration: 1n,
    producerVersion: "0.0.3",
    baseId: "default",
    baseFingerprint: new Uint8Array(),
    configurationVersion: new Uint8Array(),
  },
  projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 1n }],
  identities: [{ logicalAddress: "Справочник.Товары", kind: "uuid", value: "00000000-0000-4000-8000-000000000001" }],
  xmlNodes: [{ logicalAddress: "Справочник.Товары", order: ["name", "synonym"], aliases: { synonym: "Synonym" }, present: ["name"] }],
  xmlValues: [{ logicalAddress: "Справочник.Товары.synonym", explicitEmpty: true, xmlText: "" }],
}

describe("encodeConfigurationIndex", () => {
  it("writes deterministic 1.0 container", () => {
    const first = encodeConfigurationIndex(sample)
    const second = encodeConfigurationIndex({
      ...sample,
      projectFiles: [...sample.projectFiles].reverse(),
      identities: [...sample.identities].reverse(),
    })

    expect(first.equals(second)).toBe(true)
    expect(first.subarray(0, 8).toString("ascii")).toBe("NKDK1CIX")
    expect(first.readUInt16LE(8)).toBe(1)
    expect(first.readUInt16LE(10)).toBe(0)
    expect(first.readUInt32LE(24)).toBe(7)
    expect(first.readBigUInt64LE(40)).toBe(BigInt(first.length))
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/encode.test.ts`

Expected: FAIL because `encodeConfigurationIndex` does not exist.

- [ ] **Step 3: Implement normalization and section encoders**

Use these exact internal contracts in `encode.ts`:

```ts
interface EncodedSection {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7
  recordCount: bigint
  bytes: Buffer
}

interface NormalizedIndex {
  data: ConfigurationIndexData
  orders: readonly (readonly string[])[]
  orderId(order: readonly string[] | undefined): number
  strings: ReturnType<typeof createStringPool>
}

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 7

export function encodeConfigurationIndex(data: ConfigurationIndexData): Buffer {
  const normalized = normalizeIndex(data)
  const sections: EncodedSection[] = [
    encodeBinding(normalized),
    encodeStrings(normalized),
    encodeProjectFiles(normalized),
    encodeIdentities(normalized),
    encodeXmlOrders(normalized),
    encodeXmlNodes(normalized),
    encodeXmlValues(normalized),
  ]
  return encodeContainer(sections)
}
```

Implement each encoder directly from sections 7–15 of `.agents/configuration-index-format/v1_0.md`. Required normalization rules:

```ts
const compareUtf8 = (left: string, right: string): number => Buffer.compare(Buffer.from(left), Buffer.from(right))

projectFiles.sort((left, right) => compareUtf8(left.projectPath, right.projectPath))
identities.sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress) || identityKind(left) - identityKind(right))
xmlNodes.sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
xmlValues.sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
orders.sort((left, right) => compareNumberArrays(left.map(strings.id), right.map(strings.id)))
```

The implementation MUST reject duplicate project paths, duplicate `logicalAddress + identityKind`, duplicate XML node/value addresses, empty orders, duplicate order keys, invalid UUIDs, empty identity strings, empty XML node records, and XML value records without flags before allocating the final container.

- [ ] **Step 4: Assemble header and directory without circular state**

Build section bytes first, assign aligned offsets, then build directory entries with section checksums, and finally write the header with the checksum of the complete directory:

```ts
const firstSectionOffset = align8(HEADER_LENGTH + DIRECTORY_ENTRY_LENGTH * SECTION_COUNT)
let nextOffset = firstSectionOffset
const placements = sections.map((section) => {
  const offset = nextOffset
  nextOffset = align8(offset + section.bytes.length)
  return { section, offset }
})
const fileLength = placements.at(-1)!.offset + placements.at(-1)!.section.bytes.length
const directory = encodeDirectory(placements)
const result = Buffer.alloc(fileLength)
encodeHeader(result, { fileLength, directoryChecksum: hashSection(directory) })
directory.copy(result, HEADER_LENGTH)
for (const placement of placements) placement.section.bytes.copy(result, placement.offset)
return result
```

The final section MUST end at `fileLength`; do not append alignment after `XML_VALUES`.

- [ ] **Step 5: Add rejection tests for logical duplicates and invalid binding state**

```ts
it("rejects half-filled binding and duplicate records", () => {
  expect(() =>
    encodeConfigurationIndex({
      ...sample,
      binding: { ...sample.binding, baseFingerprint: Uint8Array.of(1) },
    })
  ).toThrow("baseFingerprint и configurationVersion")

  expect(() =>
    encodeConfigurationIndex({
      ...sample,
      projectFiles: [sample.projectFiles[0], sample.projectFiles[0]],
    })
  ).toThrow("Повторный путь PROJECT_FILES")
})
```

- [ ] **Step 6: Run encoder tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/encode.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/configurationIndex/encode.ts packages/core/metadata/configurationIndex/encode.test.ts packages/core/metadata/configurationIndex/index.ts
git commit -m "feat: :sparkles: кодировать индекс конфигурации 1.0"
```

### Task 4: Строгий читатель и проверка повреждений

**Files:**
- Create: `packages/core/metadata/configurationIndex/decode.ts`
- Create: `packages/core/metadata/configurationIndex/decode.test.ts`
- Create: `packages/core/metadata/configurationIndex/testData.ts`
- Modify: `packages/core/metadata/configurationIndex/index.ts`

**Interfaces:**
- Consumes: buffer produced by `encodeConfigurationIndex`.
- Produces: `decodeConfigurationIndex(buffer: Uint8Array, options?: { expectedBaseId?: string; expectedProducerVersion?: string }): ConfigurationIndexData`.

- [ ] **Step 1: Add the shared complete test data**

Create `testData.ts`; encoder, decoder, fragment, and file-I/O tests import these functions instead of defining partial samples:

```ts
import { NKDK_CORE_VERSION } from "../../version"
import type { ConfigurationIndexData, ConfigurationIndexFragment } from "./types"

export function sampleIndex(): ConfigurationIndexData {
  return {
    binding: {
      indexGeneration: 1n,
      producerVersion: NKDK_CORE_VERSION,
      baseId: "default",
      baseFingerprint: new Uint8Array(),
      configurationVersion: new Uint8Array(),
    },
    projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 1n }],
    identities: [{
      logicalAddress: "Справочник.Товары",
      kind: "uuid",
      value: "00000000-0000-4000-8000-000000000001",
    }],
    xmlNodes: [{
      logicalAddress: "Справочник.Товары",
      order: ["name", "synonym"],
      aliases: { synonym: "Synonym" },
      present: ["name"],
    }],
    xmlValues: [{ logicalAddress: "Справочник.Товары.synonym", explicitEmpty: true, xmlText: "" }],
  }
}

export function sampleFragments(): ConfigurationIndexFragment[] {
  const data = sampleIndex()
  return [
    {
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      identities: data.identities,
      xmlNodes: data.xmlNodes,
      xmlValues: data.xmlValues,
    },
    {
      targetProjectPath: "Конфигурация.yaml",
      identities: [],
      xmlNodes: [{ logicalAddress: "Конфигурация", present: ["name"] }],
      xmlValues: [],
    },
  ]
}
```

- [ ] **Step 2: Write a round-trip test**

```ts
import { describe, expect, it } from "vitest"
import { decodeConfigurationIndex } from "./decode"
import { encodeConfigurationIndex } from "./encode"

describe("decodeConfigurationIndex", () => {
  it("round-trips every logical section", () => {
    const encoded = encodeConfigurationIndex(sampleIndex())
    expect(decodeConfigurationIndex(encoded, { expectedBaseId: "default", expectedProducerVersion: NKDK_CORE_VERSION })).toEqual(
      sampleIndex()
    )
  })
})
```

- [ ] **Step 3: Write table-driven corruption tests in normative order**

```ts
it.each([
  ["magic", (buffer: Buffer) => { buffer.write("BROKEN!!", 0, 8, "ascii"); return buffer }],
  ["directory checksum", (buffer: Buffer) => { buffer.writeUInt8(buffer.readUInt8(64) ^ 1, 64); return buffer }],
  ["section checksum", (buffer: Buffer) => { buffer.writeUInt8(buffer.readUInt8(512) ^ 1, 512); return buffer }],
  ["trailing bytes", (buffer: Buffer) => Buffer.concat([buffer, Buffer.from([0])])],
] as const)("rejects invalid %s", (_name, mutate) => {
  const source = encodeConfigurationIndex(sampleIndex())
  const corrupted = mutate(Buffer.from(source))
  expect(() => decodeConfigurationIndex(corrupted)).toThrow("Некорректный файл индекса конфигурации")
})
```

- [ ] **Step 4: Run tests and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/decode.test.ts`

Expected: FAIL because the decoder and shared test data do not exist.

- [ ] **Step 5: Implement the ordered validation pipeline**

Use these internal stages and do not parse a later structure before its prerequisite succeeds:

```ts
export function decodeConfigurationIndex(
  input: Uint8Array,
  options: DecodeConfigurationIndexOptions = {}
): ConfigurationIndexData {
  try {
    const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength)
    const header = readAndValidateHeader(buffer)
    const directory = readAndValidateDirectory(buffer, header)
    validateSectionPlacement(buffer, directory)
    validateSectionChecksums(buffer, directory)
    const strings = decodeStrings(sectionBytes(buffer, directory, 2), directoryEntry(directory, 2).recordCount)
    const data = decodeLogicalSections(buffer, directory, strings)
    validateCrossReferences(data)
    validateExpectations(data.binding, options)
    return data
  } catch (caught) {
    if (caught instanceof ConfigurationIndexCompatibilityError) throw caught
    throw new Error(`Некорректный файл индекса конфигурации: ${errorMessage(caught)}`)
  }
}
```

Implement bounds through one helper that rejects negative values, values above `Number.MAX_SAFE_INTEGER`, integer overflow, and `offset + length > buffer.length`. Validate zero padding and reserved bytes. Decode UTF-8 with `new TextDecoder("utf-8", { fatal: true })`.

- [ ] **Step 6: Separate incompatibility from corruption**

```ts
export class ConfigurationIndexCompatibilityError extends Error {
  readonly code = "configuration_index_incompatible"
}

function validateExpectations(binding: ConfigurationIndexBinding, options: DecodeConfigurationIndexOptions): void {
  if (options.expectedBaseId !== undefined && binding.baseId !== options.expectedBaseId) {
    throw new ConfigurationIndexCompatibilityError(`Ожидалась привязка ${options.expectedBaseId}, получена ${binding.baseId}`)
  }
  if (options.expectedProducerVersion !== undefined && binding.producerVersion !== options.expectedProducerVersion) {
    throw new ConfigurationIndexCompatibilityError("Файл индекса создан другой версией NKDK; требуется повторный import")
  }
}
```

- [ ] **Step 7: Run decoder and encoder tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/encode.test.ts metadata/configurationIndex/decode.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/configurationIndex
git commit -m "feat: :sparkles: проверять индекс конфигурации 1.0"
```

### Task 5: Передаваемый буфер фрагментов worker

**Files:**
- Create: `packages/core/metadata/configurationIndex/fragment.ts`
- Create: `packages/core/metadata/configurationIndex/fragment.test.ts`
- Modify: `packages/core/metadata/configurationIndex/index.ts`

**Interfaces:**
- Consumes: `readonly ConfigurationIndexFragment[]` collected by one worker.
- Produces: `encodeConfigurationIndexFragments(fragments): ArrayBuffer`.
- Produces: `decodeConfigurationIndexFragments(buffer): ConfigurationIndexFragment[]`.
- Produces: `mergeConfigurationIndexFragments(workerBuffers): Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">`.

- [ ] **Step 1: Write failing transfer and merge tests**

```ts
import { describe, expect, it } from "vitest"
import {
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"

describe("configuration index worker fragments", () => {
  it("uses one transferable ArrayBuffer per worker", () => {
    const fragments = sampleFragments()
    const buffer = encodeConfigurationIndexFragments(fragments)
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(decodeConfigurationIndexFragments(buffer)).toEqual(fragments)
  })

  it("merges buffers deterministically and rejects address conflicts", () => {
    const left = encodeConfigurationIndexFragments([sampleFragments()[0]])
    const right = encodeConfigurationIndexFragments([sampleFragments()[1]])
    expect(mergeConfigurationIndexFragments([right, left])).toEqual(mergeConfigurationIndexFragments([left, right]))
    expect(() => mergeConfigurationIndexFragments([left, left])).toThrow("Конфликт logicalAddress")
  })
})
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/fragment.test.ts`

Expected: FAIL because `fragment.ts` does not exist.

- [ ] **Step 3: Implement the transient format**

The transient buffer is internal and MUST NOT reuse the `NKDK1CIX` header. Use this fixed envelope:

```ts
const FRAGMENT_MAGIC = "NKDKCIF1"

interface EncodedFragmentIdentity {
  logicalAddressStringId: number
  kind: "uuid" | "xmlId" | "xmlName"
  valueStringId: number
}

interface EncodedFragmentXmlNode {
  logicalAddressStringId: number
  orderStringIds?: number[]
  aliasStringIdPairs?: Array<[number, number]>
  presentStringIds?: number[]
}

interface EncodedFragmentXmlValue {
  logicalAddressStringId: number
  xsiNil?: true
  explicitEmpty?: true
  xsiTypeStringId?: number
  xmlTextStringId?: number
  xmlPrefixStringId?: number
  userSettingsIdStringId?: number
}

interface FragmentEnvelope {
  magic: typeof FRAGMENT_MAGIC
  version: 1
  strings: string[]
  fragments: Array<{
    targetProjectPathStringId: number
    identities: EncodedFragmentIdentity[]
    xmlNodes: EncodedFragmentXmlNode[]
    xmlValues: EncodedFragmentXmlValue[]
  }>
}
```

Encode UTF-8 JSON into a newly allocated `ArrayBuffer` for the first implementation, replacing strings in records by IDs from one local pool per worker. Decode with fatal UTF-8, validate `magic`, version, string IDs, record types, and target path. This buffer is transferred with Piscina `move(buffer)` in the import plan and is never written to disk.

- [ ] **Step 4: Implement deterministic merge**

```ts
export function mergeConfigurationIndexFragments(buffers: readonly ArrayBuffer[]): ConfigurationIndexFragmentData {
  const fragments = buffers.flatMap(decodeConfigurationIndexFragments)
  const identities = fragments.flatMap((fragment) => fragment.identities)
  const xmlNodes = fragments.flatMap((fragment) => fragment.xmlNodes)
  const xmlValues = fragments.flatMap((fragment) => fragment.xmlValues)
  assertUniqueIdentityKeys(identities)
  assertUniqueAddresses("XML_NODES", xmlNodes)
  assertUniqueAddresses("XML_VALUES", xmlValues)
  return normalizeFragmentData({ identities, xmlNodes, xmlValues })
}
```

- [ ] **Step 5: Run focused tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/fragment.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/configurationIndex/fragment.ts packages/core/metadata/configurationIndex/fragment.test.ts packages/core/metadata/configurationIndex/index.ts
git commit -m "feat: :sparkles: передавать фрагменты индекса из worker"
```

### Task 6: Rule-guided хэширование и атомарное хранение

**Files:**
- Create: `packages/core/metadata/configurationIndex/projectFiles.ts`
- Create: `packages/core/metadata/configurationIndex/projectFiles.test.ts`
- Create: `packages/core/metadata/configurationIndex/fileIO.ts`
- Create: `packages/core/metadata/configurationIndex/fileIO.test.ts`
- Modify: `packages/core/version.ts`
- Modify: `packages/core/version.test.ts`
- Modify: `packages/core/scripts/build.mjs`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `packages/core/metadata/project/syncStateFiles.ts`
- Modify: `.gitignore`
- Modify: `packages/core/metadata/configurationIndex/index.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- Consumes: `collectSyncStateFilePaths(projectDir)` after it excludes `.nkdk/`.
- Produces: `hashConfigurationProjectFiles(projectDir, { concurrency? }): Promise<ConfigurationProjectFile[]>`.
- Produces: `configurationIndexPath(projectDir, baseId): string`.
- Produces: `readConfigurationIndex(params)` and `writeConfigurationIndexAtomically(params)`.
- Produces: `NKDK_CORE_VERSION`.

- [ ] **Step 1: Write failing project hash tests**

```ts
it("hashes all rule-guided files and excludes .nkdk", async () => {
  const projectDir = await createProjectFixture()
  await fs.promises.mkdir(join(projectDir, ".nkdk", "tmp"), { recursive: true })
  await fs.promises.writeFile(join(projectDir, ".nkdk", "tmp", "ignored.yaml"), "ignored")

  const entries = await hashConfigurationProjectFiles(projectDir, { concurrency: 2 })

  expect(entries.map((entry) => entry.projectPath)).toContain("Конфигурация.yaml")
  expect(entries.some((entry) => entry.projectPath.startsWith(".nkdk/"))).toBe(false)
  expect(entries).toEqual([...entries].sort((left, right) => Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath))))
})
```

- [ ] **Step 2: Write failing atomic write tests**

```ts
it("replaces default.bin only after encoding and verification", async () => {
  const projectDir = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-index-"))
  const first = sampleIndex()
  await writeConfigurationIndexAtomically({ projectDir, data: first })
  const indexPath = configurationIndexPath(projectDir, "default")
  expect(await readConfigurationIndex({ projectDir, baseId: "default" })).toEqual(first)

  await expect(
    writeConfigurationIndexAtomically({
      projectDir,
      data: { ...first, binding: { ...first.binding, baseId: "wrong" } },
    })
  ).rejects.toThrow("baseId")
  expect(await fs.promises.readFile(indexPath)).toEqual(encodeConfigurationIndex(first))
})
```

- [ ] **Step 3: Run and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/projectFiles.test.ts metadata/configurationIndex/fileIO.test.ts version.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 4: Exclude the complete `.nkdk` tree from project discovery**

Change `shouldSkipProjectEntry` in `syncStateFiles.ts` to:

```ts
function shouldSkipProjectEntry(relativeDir: string, name: string): boolean {
  if (name === ".DS_Store") return true
  if (relativeDir === "" && (name === ".git" || name === ".nkdk" || name === ".nkdk-sync.yaml")) return true
  if (relativeDir === "" && name === "Миграции") return true
  return false
}
```

Add `.nkdk/` to the repository `.gitignore`.

- [ ] **Step 5: Implement bounded parallel hashing**

```ts
export async function hashConfigurationProjectFiles(
  projectDir: string,
  options: { concurrency?: number } = {}
): Promise<ConfigurationProjectFile[]> {
  const concurrency = normalizePositiveInteger(options.concurrency ?? 16)
  const limit = pLimit(concurrency)
  const paths = await collectSyncStateFilePaths(resolve(projectDir))
  return Promise.all(
    paths.map((projectPath) =>
      limit(async () => ({
        projectPath,
        contentHash: hashFileBytes(await fs.promises.readFile(join(projectDir, ...projectPath.split("/")))),
      }))
    )
  )
}
```

- [ ] **Step 6: Implement version injection for both builds**

Keep the `NKDK_CORE_VERSION` contract created in Task 1. Read `packages/core/package.json` in both `packages/core/scripts/build.mjs` and `packages/mcp/scripts/build.mjs`, then add:

```js
define: {
  __NKDK_CORE_VERSION__: JSON.stringify(corePackageJson.version),
}
```

Merge this with the existing MCP `__NKDK_MCP_VERSION__` define rather than replacing it.

- [ ] **Step 7: Implement path, read, and atomic write**

```ts
export const DEFAULT_CONFIGURATION_INDEX_BASE_ID = "default"

export function configurationIndexPath(projectDir: string, baseId = DEFAULT_CONFIGURATION_INDEX_BASE_ID): string {
  assertBaseId(baseId)
  return join(resolve(projectDir), ".nkdk", "configuration-index", `${baseId}.bin`)
}

export async function writeConfigurationIndexAtomically(params: {
  projectDir: string
  data: ConfigurationIndexData
}): Promise<void> {
  const target = configurationIndexPath(params.projectDir, params.data.binding.baseId)
  const directory = dirname(target)
  await fs.promises.mkdir(directory, { recursive: true })
  const temporary = join(directory, `.${basename(target)}.${randomUUID()}.tmp`)
  try {
    const encoded = encodeConfigurationIndex(params.data)
    const writeHandle = await fs.promises.open(temporary, "wx")
    try {
      await writeHandle.writeFile(encoded)
    } finally {
      await writeHandle.close()
    }
    const verificationHandle = await fs.promises.open(temporary, "r+")
    try {
      decodeConfigurationIndex(await verificationHandle.readFile(), {
        expectedBaseId: params.data.binding.baseId,
        expectedProducerVersion: params.data.binding.producerVersion,
      })
      await verificationHandle.sync()
    } finally {
      await verificationHandle.close()
    }
    await fs.promises.rename(temporary, target)
    await syncDirectoryIfSupported(directory)
  } finally {
    await fs.promises.rm(temporary, { force: true })
  }
}
```

`readConfigurationIndex` reads the target and calls the strict decoder with expected base ID and current `NKDK_CORE_VERSION`.

`assertBaseId` accepts only `default` in version 1.0. `syncDirectoryIfSupported` opens the directory read-only, calls `sync()`, closes the handle in `finally`, and ignores only platform errors `EINVAL`, `EPERM`, `EISDIR`, and `ENOTSUP`; every other error is propagated.

- [ ] **Step 8: Run focused tests and type-check core**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex metadata/project/syncStateFiles.test.ts version.test.ts`

Expected: PASS.

Run: `pnpm --filter @nkdk/core type-check`

Expected: exit code 0.

- [ ] **Step 9: Commit**

```bash
git add .gitignore packages/core/index.ts packages/core/version.ts packages/core/version.test.ts packages/core/scripts/build.mjs packages/mcp/scripts/build.mjs packages/core/metadata/configurationIndex packages/core/metadata/project/syncStateFiles.ts packages/core/metadata/project/syncStateFiles.test.ts
git commit -m "feat: :sparkles: хранить индекс конфигурации атомарно"
```

### Task 7: Complete codec verification

**Files:**
- None planned.

**Interfaces:**
- Verifies every public interface produced by Tasks 1–6.

- [ ] **Step 1: Run all configuration-index tests without isolation shortcuts**

Run: `pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/configurationIndex`

Expected: all configuration-index tests PASS.

- [ ] **Step 2: Run the complete core test suite**

Run: `pnpm --filter @nkdk/core test`

Expected: exit code 0 and zero failed tests.

- [ ] **Step 3: Run the core production build**

Run: `pnpm --filter @nkdk/core build`

Expected: exit code 0; `dist/index.js` and `dist/preparedYamlProjectWorker.js` are produced.

- [ ] **Step 4: Record the verification result**

Do not modify or commit files in this task. If a command fails, stop and add a separate correction task with the exact failing test, affected file, and expected behavior before changing implementation.
