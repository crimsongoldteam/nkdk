# Validation Binary Shared Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the JSON-backed shared owner snapshot with a compact binary `SharedArrayBuffer` owner/field/file snapshot for full validation second pass.

**Architecture:** Add a binary owner snapshot implementation next to the current JSON implementation, expose it through the existing `SharedValidationSnapshot` shape, and select it with `NKDK_VALIDATION_SHARED_OWNER_FORMAT=binary`. Workers build `OwnerMetadataCache` from a light view over typed arrays and only materialize the requested owner field index.

**Tech Stack:** TypeScript, Node.js `worker_threads`, `SharedArrayBuffer`, `Int32Array`, `Uint8Array`, Vitest.

---

## File Structure

- Create: `packages/core/metadata/validation/sharedStringPool.ts`
  - Owns UTF-8 string interning, binary string table creation, and string lookup by id.
- Create: `packages/core/metadata/validation/sharedValidationBinaryOwners.ts`
  - Owns binary encoding/decoding for owners, fields, aliases, table columns, files, and compact diagnostics.
- Modify: `packages/core/metadata/validation/sharedValidationSnapshot.ts`
  - Adds `owners.format`, delegates owner snapshot creation to JSON or binary implementation.
- Modify: `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts`
  - Chooses JSON or binary owner cache based on `snapshot.owners.format`.
- Test: `packages/core/metadata/validation/sharedStringPool.test.ts`
  - Verifies string id stability, UTF-8 round-trip, and duplicate interning.
- Test: `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`
  - Verifies binary lookup and field index reconstruction against the regular owner cache.
- Modify: `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`
  - Keeps JSON behavior and adds binary format selection through `NKDK_VALIDATION_SHARED_OWNER_FORMAT`.
- Modify: `docs/superpowers/plans/2026-07-02-validation-binary-shared-snapshot.md`
  - Track task completion and measured profile results.

---

### Task 1: Shared String Pool

**Files:**
- Create: `packages/core/metadata/validation/sharedStringPool.ts`
- Test: `packages/core/metadata/validation/sharedStringPool.test.ts`

- [ ] **Step 1: Write failing tests for string interning and lookup**

Create `packages/core/metadata/validation/sharedStringPool.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createSharedStringPool, createSharedStringPoolView } from "./sharedStringPool"

describe("SharedStringPool", () => {
  it("deduplicates strings and restores UTF-8 values by id", () => {
    const pool = createSharedStringPool(["Справочник", "Номенклатура", "Справочник", "", "Артикул"])
    const view = createSharedStringPoolView(pool)

    expect(pool.count).toBe(4)
    expect(pool.idByValue.get("Справочник")).toBe(0)
    expect(pool.idByValue.get("Номенклатура")).toBe(1)
    expect(pool.idByValue.get("")).toBe(2)
    expect(pool.idByValue.get("Артикул")).toBe(3)
    expect(view.get(0)).toBe("Справочник")
    expect(view.get(1)).toBe("Номенклатура")
    expect(view.get(2)).toBe("")
    expect(view.get(3)).toBe("Артикул")
  })

  it("throws for an invalid string id", () => {
    const pool = createSharedStringPool(["Справочник"])
    const view = createSharedStringPoolView(pool)

    expect(() => view.get(1)).toThrow("Некорректный string id")
  })
})
```

- [ ] **Step 2: Run the failing string pool tests**

Run:

```bash
pnpm --filter @nakidka/core test -- sharedStringPool.test.ts
```

Expected: FAIL because `sharedStringPool.ts` does not exist.

- [ ] **Step 3: Implement the shared string pool**

Create `packages/core/metadata/validation/sharedStringPool.ts`:

```ts
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const MAGIC = 0x4e4b4453
const VERSION = 1
const HEADER_INTS = 4
const ENTRY_INTS = 2

export interface SharedStringPool {
  buffer: SharedArrayBuffer
  count: number
  bytes: number
  idByValue: Map<string, number>
}

export interface SharedStringPoolView {
  get(id: number): string
}

export function createSharedStringPool(values: readonly string[]): SharedStringPool {
  const idByValue = new Map<string, number>()
  const unique: string[] = []
  for (const value of values) {
    if (idByValue.has(value)) continue
    idByValue.set(value, unique.length)
    unique.push(value)
  }

  const encoded = unique.map((value) => textEncoder.encode(value))
  const headerBytes = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT
  const tableBytes = unique.length * ENTRY_INTS * Int32Array.BYTES_PER_ELEMENT
  const stringsOffset = headerBytes + tableBytes
  const stringBytes = encoded.reduce((total, item) => total + item.byteLength, 0)
  const buffer = new SharedArrayBuffer(stringsOffset + stringBytes)
  const ints = new Int32Array(buffer, 0, HEADER_INTS + unique.length * ENTRY_INTS)
  const bytes = new Uint8Array(buffer)

  ints[0] = MAGIC
  ints[1] = VERSION
  ints[2] = unique.length
  ints[3] = stringsOffset

  let cursor = stringsOffset
  encoded.forEach((value, index) => {
    const base = HEADER_INTS + index * ENTRY_INTS
    ints[base] = cursor
    ints[base + 1] = value.byteLength
    bytes.set(value, cursor)
    cursor += value.byteLength
  })

  return { buffer, count: unique.length, bytes: buffer.byteLength, idByValue }
}

export function createSharedStringPoolView(pool: Pick<SharedStringPool, "buffer" | "count">): SharedStringPoolView {
  const header = new Int32Array(pool.buffer, 0, HEADER_INTS)
  if (header[0] !== MAGIC || header[1] !== VERSION) throw new Error("Некорректный shared string pool")
  const count = header[2] ?? 0
  const ints = new Int32Array(pool.buffer, 0, HEADER_INTS + count * ENTRY_INTS)
  const bytes = new Uint8Array(pool.buffer)

  return {
    get(id) {
      if (!Number.isInteger(id) || id < 0 || id >= count) throw new Error(`Некорректный string id ${id}`)
      const base = HEADER_INTS + id * ENTRY_INTS
      const offset = ints[base] ?? 0
      const length = ints[base + 1] ?? 0
      return textDecoder.decode(bytes.subarray(offset, offset + length))
    },
  }
}
```

- [ ] **Step 4: Run string pool tests**

Run:

```bash
pnpm --filter @nakidka/core test -- sharedStringPool.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add packages/core/metadata/validation/sharedStringPool.ts packages/core/metadata/validation/sharedStringPool.test.ts
git commit -m "perf: :zap: добавить shared string pool validation"
```

---

### Task 2: Binary Owner Snapshot Builder

**Files:**
- Create: `packages/core/metadata/validation/sharedValidationBinaryOwners.ts`
- Test: `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`

- [ ] **Step 1: Write failing tests for binary owner lookup**

Create `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationObjectRecord } from "./projectValidationTypes"
import { createBinarySharedOwnersSnapshot, createOwnerMetadataCacheFromBinarySharedOwners } from "./sharedValidationBinaryOwners"

describe("SharedValidationBinaryOwners", () => {
  it("restores owner field indexes without JSON decoding", () => {
    const table = createValidationObjectTable({
      records: [catalogRecord()],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
    })
    const snapshot = createBinarySharedOwnersSnapshot(table.snapshot())
    const regular = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })
    const binary = createOwnerMetadataCacheFromBinarySharedOwners({ projectDir: "/project", snapshot })

    const regularOwner = regular.get({ kind: "Справочник", name: "Номенклатура" })
    const binaryOwner = binary.get({ kind: "Справочник", name: "Номенклатура" })

    expect(snapshot.bytes).toBeGreaterThan(0)
    expect(binaryOwner.status).toBe("ok")
    expect(binaryOwner).toMatchObject({ status: regularOwner.status })
    if (binaryOwner.status !== "ok" || regularOwner.status !== "ok") throw new Error("owner expected")
    expect([...binaryOwner.owner.fieldIndex.fields.entries()]).toEqual([...regularOwner.owner.fieldIndex.fields.entries()])
    expect([...binaryOwner.owner.fieldIndex.standardAttributeAliases.entries()]).toEqual(
      [...regularOwner.owner.fieldIndex.standardAttributeAliases.entries()]
    )
  })

  it("returns not-found diagnostics for missing owners", () => {
    const table = createValidationObjectTable({ records: [], filePaths: [] })
    const snapshot = createBinarySharedOwnersSnapshot(table.snapshot())
    const binary = createOwnerMetadataCacheFromBinarySharedOwners({ projectDir: "/project", snapshot })

    expect(binary.get({ kind: "Справочник", name: "НетТакого" })).toMatchObject({ status: "not-found" })
  })
})

function catalogRecord(): ValidationObjectRecord {
  return {
    filePath: "/project/Справочник/Номенклатура/Свойства.yaml",
    projectPath: "Справочник/Номенклатура/Свойства.yaml",
    kind: "properties",
    owner: { dir: "Справочник", name: "Номенклатура" },
    ownerRef: { kind: "Справочник", name: "Номенклатура" },
    model: { itemType: "MetadataCatalog", name: "Номенклатура" },
    fieldIndex: {
      fields: new Map([
        [
          "Артикул",
          {
            name: "Артикул",
            kind: "attribute",
            sourceCollection: "attributes",
            typeInfo: { kinds: ["string"], nextTypes: [], sourceText: "String" },
          },
        ],
        [
          "Товары",
          {
            name: "Товары",
            kind: "tabularSection",
            sourceCollection: "tabularSections",
            typeInfo: {
              kinds: ["tableSource"],
              nextTypes: [],
              table: { kind: "TabularSection", owner: { kind: "Справочник", name: "Номенклатура" }, name: "Товары" },
            },
            tableSource: {
              table: { kind: "TabularSection", owner: { kind: "Справочник", name: "Номенклатура" }, name: "Товары" },
              columns: new Map([
                [
                  "Количество",
                  {
                    name: "Количество",
                    kind: "attribute",
                    sourceCollection: "attributes",
                    typeInfo: { kinds: ["decimal"], nextTypes: [], sourceText: "Number" },
                  },
                ],
              ]),
              hasColumns: true,
            },
          },
        ],
      ]),
      standardAttributeAliases: new Map([["Code", "Код"]]),
      diagnostics: [],
    },
    importDiagnostics: [],
  }
}
```

- [ ] **Step 2: Run the failing binary owner tests**

Run:

```bash
pnpm --filter @nakidka/core test -- sharedValidationBinaryOwners.test.ts
```

Expected: FAIL because `sharedValidationBinaryOwners.ts` does not exist.

- [ ] **Step 3: Implement binary owner snapshot types and constants**

Create `packages/core/metadata/validation/sharedValidationBinaryOwners.ts` with these exported interfaces and constants, then continue in the next step in the same file:

```ts
import { resolve } from "path"
import { getDataPathOwnerKind } from "./dataPath/registry"
import type { OwnerMetadataCache, OwnerMetadataResult } from "./dataPath/ownerCache"
import type { ObjectField, ObjectFieldIndex, ObjectFieldTableSource } from "./dataPath/objectFields"
import type { DataPathTypeInfo, OwnerTypeRef } from "./dataPath/types"
import type { ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import { createSharedStringPool, createSharedStringPoolView, type SharedStringPool } from "./sharedStringPool"
import type { Diagnostic } from "./types"

const MAGIC = 0x4e4b444f
const VERSION = 1
const HEADER_INTS = 8
const OWNER_INTS = 10
const FIELD_INTS = 15
const ALIAS_INTS = 3
const DIAGNOSTIC_INTS = 5

const STATUS_OK = 1
const STATUS_IMPORT_ERROR = 2

const KIND_ATTRIBUTE = 1
const KIND_STANDARD_ATTRIBUTE = 2
const KIND_TABULAR_SECTION = 3
const KIND_DIMENSION = 4
const KIND_RESOURCE = 5
const KIND_ADDRESSING_ATTRIBUTE = 6

const TYPE_UNKNOWN = 1 << 0
const TYPE_BOOLEAN = 1 << 1
const TYPE_STRING = 1 << 2
const TYPE_DECIMAL = 1 << 3
const TYPE_DATE_TIME = 1 << 4
const TYPE_UUID = 1 << 5
const TYPE_DEFINED = 1 << 6
const TYPE_TABLE_SOURCE = 1 << 7
const TYPE_STYLE_ITEM = 1 << 8

export interface BinarySharedOwnersSnapshot {
  format: "binary"
  strings: Pick<SharedStringPool, "buffer" | "count" | "bytes">
  table: SharedArrayBuffer
  bytes: number
  records: number
  files: number
}

interface EncodedOwner {
  ref: OwnerTypeRef
  filePath: string
  status: number
  diagnostics: Diagnostic[]
  fields: EncodedField[]
  aliases: Array<[string, string]>
}

interface EncodedField {
  ownerKey: string
  name: string
  targetName: string
  kind: ObjectField["kind"]
  sourceCollection: string
  typeInfo: DataPathTypeInfo
  tableSource?: ObjectFieldTableSource
  columns: EncodedField[]
}
```

- [ ] **Step 4: Implement binary snapshot creation**

Add this code below the constants and interfaces:

```ts
export function createBinarySharedOwnersSnapshot(snapshot: ValidationObjectTableSnapshot): BinarySharedOwnersSnapshot {
  const owners = snapshot.records
    .filter((record) => record.ownerRef !== undefined)
    .map(encodeOwner)
    .sort(compareOwners)

  const stringValues: string[] = []
  for (const owner of owners) {
    stringValues.push(owner.ref.kind, owner.ref.name ?? "", owner.filePath)
    for (const diagnostic of owner.diagnostics) {
      stringValues.push(diagnostic.filePath, diagnostic.source, diagnostic.message)
    }
    for (const [alias, target] of owner.aliases) stringValues.push(alias, target)
    for (const field of owner.fields) collectFieldStrings(field, stringValues)
  }
  stringValues.push(...snapshot.filePaths)
  const strings = createSharedStringPool(stringValues)
  const stringId = (value: string): number => {
    const id = strings.idByValue.get(value)
    if (id === undefined) throw new Error(`String pool не содержит "${value}"`)
    return id
  }

  const flatFields: EncodedField[] = []
  const flatAliases: Array<[number, string, string]> = []
  const flatDiagnostics: Array<[number, Diagnostic]> = []
  const ownerRows = owners.map((owner, ownerId) => {
    const fieldStart = flatFields.length
    for (const field of owner.fields) appendFieldWithColumns(flatFields, field)
    const aliasStart = flatAliases.length
    for (const [alias, target] of owner.aliases) flatAliases.push([ownerId, alias, target])
    const diagnosticStart = flatDiagnostics.length
    for (const diagnostic of owner.diagnostics) flatDiagnostics.push([ownerId, diagnostic])
    return { owner, fieldStart, aliasStart, diagnosticStart }
  })

  const headerBytes = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT
  const ownerBytes = ownerRows.length * OWNER_INTS * Int32Array.BYTES_PER_ELEMENT
  const fieldBytes = flatFields.length * FIELD_INTS * Int32Array.BYTES_PER_ELEMENT
  const aliasBytes = flatAliases.length * ALIAS_INTS * Int32Array.BYTES_PER_ELEMENT
  const diagnosticBytes = flatDiagnostics.length * DIAGNOSTIC_INTS * Int32Array.BYTES_PER_ELEMENT
  const table = new SharedArrayBuffer(headerBytes + ownerBytes + fieldBytes + aliasBytes + diagnosticBytes)
  const ints = new Int32Array(table)

  const ownersOffset = HEADER_INTS
  const fieldsOffset = ownersOffset + ownerRows.length * OWNER_INTS
  const aliasesOffset = fieldsOffset + flatFields.length * FIELD_INTS
  const diagnosticsOffset = aliasesOffset + flatAliases.length * ALIAS_INTS

  ints[0] = MAGIC
  ints[1] = VERSION
  ints[2] = ownerRows.length
  ints[3] = flatFields.length
  ints[4] = flatAliases.length
  ints[5] = flatDiagnostics.length
  ints[6] = snapshot.filePaths.length
  ints[7] = table.byteLength + strings.bytes

  ownerRows.forEach(({ owner, fieldStart, aliasStart, diagnosticStart }, index) => {
    const base = ownersOffset + index * OWNER_INTS
    ints[base] = stringId(owner.ref.kind)
    ints[base + 1] = stringId(owner.ref.name ?? "")
    ints[base + 2] = stringId(owner.filePath)
    ints[base + 3] = fieldStart
    ints[base + 4] = owner.fields.length
    ints[base + 5] = aliasStart
    ints[base + 6] = owner.aliases.length
    ints[base + 7] = diagnosticStart
    ints[base + 8] = owner.diagnostics.length
    ints[base + 9] = owner.status
  })

  flatFields.forEach((field, index) => {
    const base = fieldsOffset + index * FIELD_INTS
    const columnStart = field.columns.length === 0 ? 0 : index + 1
    const columnCount = field.columns.length
    const table = field.tableSource?.table
    ints[base] = stringId(field.name)
    ints[base + 1] = stringId(field.targetName)
    ints[base + 2] = encodeFieldKind(field.kind)
    ints[base + 3] = encodeTypeFlags(field.typeInfo)
    ints[base + 4] = stringId(field.typeInfo.sourceText ?? "")
    ints[base + 5] = stringId(field.sourceCollection)
    ints[base + 6] = stringId(table?.kind ?? "")
    ints[base + 7] = stringId("owner" in (table ?? {}) ? table.owner.kind : "")
    ints[base + 8] = stringId("owner" in (table ?? {}) ? table.owner.name ?? "" : "")
    ints[base + 9] = stringId("name" in (table ?? {}) ? table.name : "")
    ints[base + 10] = columnStart
    ints[base + 11] = columnCount
    ints[base + 12] = field.tableSource?.hasColumns === true ? 1 : 0
    ints[base + 13] = stringId((field.typeInfo.nextTypes[0]?.kind) ?? "")
    ints[base + 14] = stringId((field.typeInfo.nextTypes[0]?.name) ?? "")
  })

  flatAliases.forEach(([, alias, target], index) => {
    const base = aliasesOffset + index * ALIAS_INTS
    ints[base] = stringId(alias)
    ints[base + 1] = stringId(target)
    ints[base + 2] = 0
  })

  flatDiagnostics.forEach(([, diagnostic], index) => {
    const base = diagnosticsOffset + index * DIAGNOSTIC_INTS
    ints[base] = stringId(diagnostic.filePath)
    ints[base + 1] = diagnostic.line
    ints[base + 2] = diagnostic.col
    ints[base + 3] = stringId(diagnostic.source)
    ints[base + 4] = stringId(diagnostic.message)
  })

  return {
    format: "binary",
    strings: { buffer: strings.buffer, count: strings.count, bytes: strings.bytes },
    table,
    bytes: table.byteLength + strings.bytes,
    records: owners.length,
    files: snapshot.filePaths.length,
  }
}
```

- [ ] **Step 5: Implement binary owner cache view**

Add this code below snapshot creation:

```ts
export function createOwnerMetadataCacheFromBinarySharedOwners(params: {
  projectDir: string
  snapshot: BinarySharedOwnersSnapshot
}): OwnerMetadataCache {
  const view = createBinaryOwnersView(params.snapshot)
  const results = new Map<string, OwnerMetadataResult>()

  return {
    get(ref) {
      const key = ownerKey(ref)
      const cached = results.get(key)
      if (cached !== undefined) return cached

      const ownerKind = getDataPathOwnerKind(ref.kind)
      const tableRef = ownerKind ? { kind: ownerKind.projectDir, name: ref.name } : ref
      const ownerId = view.findOwner(tableRef)
      const result =
        ownerId === undefined
          ? notFound(resolve(params.projectDir), ownerKind?.projectDir ?? ref.kind, ref)
          : ownerResult(ref, view, ownerId)
      results.set(key, result)
      return result
    },
  }
}

function createBinaryOwnersView(snapshot: BinarySharedOwnersSnapshot) {
  const header = new Int32Array(snapshot.table, 0, HEADER_INTS)
  if (header[0] !== MAGIC || header[1] !== VERSION) throw new Error("Некорректный binary shared owner snapshot")
  const ownerCount = header[2] ?? 0
  const fieldCount = header[3] ?? 0
  const aliasCount = header[4] ?? 0
  const diagnosticCount = header[5] ?? 0
  const strings = createSharedStringPoolView(snapshot.strings)
  const ints = new Int32Array(snapshot.table)
  const ownersOffset = HEADER_INTS
  const fieldsOffset = ownersOffset + ownerCount * OWNER_INTS
  const aliasesOffset = fieldsOffset + fieldCount * FIELD_INTS
  const diagnosticsOffset = aliasesOffset + aliasCount * ALIAS_INTS

  return {
    findOwner(ref: OwnerTypeRef): number | undefined {
      let left = 0
      let right = ownerCount - 1
      const kind = ref.kind
      const name = ref.name ?? ""
      while (left <= right) {
        const middle = Math.floor((left + right) / 2)
        const base = ownersOffset + middle * OWNER_INTS
        const currentKind = strings.get(ints[base] ?? 0)
        const currentName = strings.get(ints[base + 1] ?? 0)
        const order = compareOwnerKey(currentKind, currentName, kind, name)
        if (order === 0) return middle
        if (order < 0) left = middle + 1
        else right = middle - 1
      }
      return undefined
    },
    owner(ownerId: number) {
      const base = ownersOffset + ownerId * OWNER_INTS
      return {
        filePath: strings.get(ints[base + 2] ?? 0),
        fieldStart: ints[base + 3] ?? 0,
        fieldCount: ints[base + 4] ?? 0,
        aliasStart: ints[base + 5] ?? 0,
        aliasCount: ints[base + 6] ?? 0,
        diagnosticStart: ints[base + 7] ?? 0,
        diagnosticCount: ints[base + 8] ?? 0,
        status: ints[base + 9] ?? 0,
      }
    },
    field(index: number): ObjectField {
      const base = fieldsOffset + index * FIELD_INTS
      const tableSource = decodeTableSource({
        strings,
        ints,
        fieldsOffset,
        columnStart: ints[base + 10] ?? 0,
        columnCount: ints[base + 11] ?? 0,
        hasColumns: (ints[base + 12] ?? 0) === 1,
        tableKind: strings.get(ints[base + 6] ?? 0),
        tableOwnerKind: strings.get(ints[base + 7] ?? 0),
        tableOwnerName: strings.get(ints[base + 8] ?? 0),
        tableName: strings.get(ints[base + 9] ?? 0),
      })
      return {
        name: strings.get(ints[base] ?? 0),
        targetName: strings.get(ints[base + 1] ?? 0) || undefined,
        kind: decodeFieldKind(ints[base + 2] ?? 0),
        sourceCollection: strings.get(ints[base + 5] ?? 0) || undefined,
        typeInfo: decodeTypeInfo(ints[base + 3] ?? 0, strings.get(ints[base + 4] ?? 0), tableSource?.table),
        ...(tableSource === undefined ? {} : { tableSource }),
      }
    },
    alias(index: number): [string, string] {
      const base = aliasesOffset + index * ALIAS_INTS
      return [strings.get(ints[base] ?? 0), strings.get(ints[base + 1] ?? 0)]
    },
    diagnostic(index: number): Diagnostic {
      const base = diagnosticsOffset + index * DIAGNOSTIC_INTS
      return {
        filePath: strings.get(ints[base] ?? 0),
        line: ints[base + 1] ?? 1,
        col: ints[base + 2] ?? 1,
        severity: "error",
        source: strings.get(ints[base + 3] ?? 0),
        message: strings.get(ints[base + 4] ?? 0),
      }
    },
  }
}
```

- [ ] **Step 6: Implement helpers for encoding, decoding, and diagnostics**

Add these helpers at the bottom of `sharedValidationBinaryOwners.ts`:

```ts
function encodeOwner(record: ValidationObjectRecord): EncodedOwner {
  const fieldIndex = record.fieldIndex
  return {
    ref: record.ownerRef as OwnerTypeRef,
    filePath: record.filePath,
    status: record.importDiagnostics.length > 0 || fieldIndex === undefined ? STATUS_IMPORT_ERROR : STATUS_OK,
    diagnostics:
      record.importDiagnostics.length > 0
        ? record.importDiagnostics
        : fieldIndex === undefined
          ? [crossFileDiagnostic(record.filePath, `Не удалось импортировать владельца ${formatOwnerRef(record.ownerRef as OwnerTypeRef)}`)]
          : [],
    fields: fieldIndex === undefined ? [] : [...fieldIndex.fields.values()].map((field) => encodeField(ownerKey(record.ownerRef as OwnerTypeRef), field)),
    aliases: fieldIndex === undefined ? [] : [...fieldIndex.standardAttributeAliases.entries()],
  }
}

function encodeField(ownerKeyValue: string, field: ObjectField): EncodedField {
  return {
    ownerKey: ownerKeyValue,
    name: field.name,
    targetName: field.targetName ?? "",
    kind: field.kind,
    sourceCollection: field.sourceCollection ?? "",
    typeInfo: field.typeInfo,
    tableSource: field.tableSource,
    columns: field.tableSource === undefined ? [] : [...field.tableSource.columns.values()].map((column) => encodeField(ownerKeyValue, column)),
  }
}

function collectFieldStrings(field: EncodedField, values: string[]): void {
  const table = field.tableSource?.table
  values.push(field.name, field.targetName, field.sourceCollection, field.typeInfo.sourceText ?? "")
  values.push(table?.kind ?? "")
  values.push("owner" in (table ?? {}) ? table.owner.kind : "")
  values.push("owner" in (table ?? {}) ? table.owner.name ?? "" : "")
  values.push("name" in (table ?? {}) ? table.name : "")
  values.push(field.typeInfo.nextTypes[0]?.kind ?? "", field.typeInfo.nextTypes[0]?.name ?? "")
  for (const column of field.columns) collectFieldStrings(column, values)
}

function appendFieldWithColumns(target: EncodedField[], field: EncodedField): void {
  target.push(field)
  for (const column of field.columns) appendFieldWithColumns(target, column)
}

function ownerResult(ref: OwnerTypeRef, view: ReturnType<typeof createBinaryOwnersView>, ownerId: number): OwnerMetadataResult {
  const owner = view.owner(ownerId)
  if (owner.status === STATUS_IMPORT_ERROR) {
    return {
      status: "import-error",
      diagnostics: Array.from({ length: owner.diagnosticCount }, (_, index) => view.diagnostic(owner.diagnosticStart + index)),
    }
  }

  const ownerKind = getDataPathOwnerKind(ref.kind)
  if (ownerKind === undefined) {
    return { status: "import-error", diagnostics: [crossFileDiagnostic(owner.filePath, `Не удалось импортировать владельца ${formatOwnerRef(ref)}`)] }
  }

  const spec = {
    kind: ownerKind.kind,
    dir: ownerKind.projectDir,
    rule: ownerKind.rule,
    exportSchema: () => ({}) as never,
    importModel: () => undefined,
  }
  const fieldIndex: ObjectFieldIndex = {
    fields: new Map(
      Array.from({ length: owner.fieldCount }, (_, index) => {
        const field = view.field(owner.fieldStart + index)
        return [field.name, field]
      })
    ),
    standardAttributeAliases: new Map(
      Array.from({ length: owner.aliasCount }, (_, index) => view.alias(owner.aliasStart + index))
    ),
    diagnostics: [],
  }

  return {
    status: "ok",
    owner: {
      ref,
      filePath: owner.filePath,
      model: {} as never,
      rule: spec.rule,
      spec,
      fieldIndex,
    },
  }
}

function encodeTypeFlags(typeInfo: DataPathTypeInfo): number {
  let flags = 0
  for (const kind of typeInfo.kinds) {
    if (kind === "unknown") flags |= TYPE_UNKNOWN
    else if (kind === "boolean") flags |= TYPE_BOOLEAN
    else if (kind === "string") flags |= TYPE_STRING
    else if (kind === "decimal") flags |= TYPE_DECIMAL
    else if (kind === "dateTime") flags |= TYPE_DATE_TIME
    else if (kind === "uuid") flags |= TYPE_UUID
    else if (kind === "defined") flags |= TYPE_DEFINED
    else if (kind === "tableSource") flags |= TYPE_TABLE_SOURCE
    else if (kind === "styleItem") flags |= TYPE_STYLE_ITEM
  }
  return flags
}

function decodeTypeInfo(flags: number, sourceText: string, table: DataPathTypeInfo["table"] | undefined): DataPathTypeInfo {
  const kinds: DataPathTypeInfo["kinds"] = []
  if ((flags & TYPE_UNKNOWN) !== 0) kinds.push("unknown")
  if ((flags & TYPE_BOOLEAN) !== 0) kinds.push("boolean")
  if ((flags & TYPE_STRING) !== 0) kinds.push("string")
  if ((flags & TYPE_DECIMAL) !== 0) kinds.push("decimal")
  if ((flags & TYPE_DATE_TIME) !== 0) kinds.push("dateTime")
  if ((flags & TYPE_UUID) !== 0) kinds.push("uuid")
  if ((flags & TYPE_DEFINED) !== 0) kinds.push("defined")
  if ((flags & TYPE_TABLE_SOURCE) !== 0) kinds.push("tableSource")
  if ((flags & TYPE_STYLE_ITEM) !== 0) kinds.push("styleItem")
  return {
    kinds: kinds.length === 0 ? ["unknown"] : kinds,
    nextTypes: [],
    ...(sourceText === "" ? {} : { sourceText }),
    ...(table === undefined ? {} : { table }),
  }
}

function encodeFieldKind(kind: ObjectField["kind"]): number {
  if (kind === "attribute") return KIND_ATTRIBUTE
  if (kind === "standardAttribute") return KIND_STANDARD_ATTRIBUTE
  if (kind === "tabularSection") return KIND_TABULAR_SECTION
  if (kind === "dimension") return KIND_DIMENSION
  if (kind === "resource") return KIND_RESOURCE
  if (kind === "addressingAttribute") return KIND_ADDRESSING_ATTRIBUTE
  return KIND_ATTRIBUTE
}

function decodeFieldKind(value: number): ObjectField["kind"] {
  if (value === KIND_STANDARD_ATTRIBUTE) return "standardAttribute"
  if (value === KIND_TABULAR_SECTION) return "tabularSection"
  if (value === KIND_DIMENSION) return "dimension"
  if (value === KIND_RESOURCE) return "resource"
  if (value === KIND_ADDRESSING_ATTRIBUTE) return "addressingAttribute"
  return "attribute"
}

function decodeTableSource(params: {
  strings: ReturnType<typeof createSharedStringPoolView>
  ints: Int32Array
  fieldsOffset: number
  columnStart: number
  columnCount: number
  hasColumns: boolean
  tableKind: string
  tableOwnerKind: string
  tableOwnerName: string
  tableName: string
}): ObjectFieldTableSource | undefined {
  if (params.tableKind !== "TabularSection") return undefined
  const table: DataPathTypeInfo["table"] = {
    kind: "TabularSection",
    owner: { kind: params.tableOwnerKind, name: params.tableOwnerName || undefined },
    name: params.tableName,
  }
  const columns = new Map<string, ObjectField>()
  for (let offset = 0; offset < params.columnCount; offset += 1) {
    const index = params.columnStart + offset
    const base = params.fieldsOffset + index * FIELD_INTS
    const field: ObjectField = {
      name: params.strings.get(params.ints[base] ?? 0),
      targetName: params.strings.get(params.ints[base + 1] ?? 0) || undefined,
      kind: decodeFieldKind(params.ints[base + 2] ?? 0),
      sourceCollection: params.strings.get(params.ints[base + 5] ?? 0) || undefined,
      typeInfo: decodeTypeInfo(params.ints[base + 3] ?? 0, params.strings.get(params.ints[base + 4] ?? 0), undefined),
    }
    columns.set(field.name, field)
  }
  return { table, columns, hasColumns: params.hasColumns }
}

function compareOwners(left: EncodedOwner, right: EncodedOwner): number {
  return compareOwnerKey(left.ref.kind, left.ref.name ?? "", right.ref.kind, right.ref.name ?? "")
}

function compareOwnerKey(leftKind: string, leftName: string, rightKind: string, rightName: string): number {
  const kindOrder = leftKind.localeCompare(rightKind)
  return kindOrder === 0 ? leftName.localeCompare(rightName) : kindOrder
}

function notFound(projectDir: string, dir: string, ref: OwnerTypeRef): OwnerMetadataResult {
  return {
    status: "not-found",
    diagnostics: [crossFileDiagnostic(`${projectDir}/${dir}/${ref.name ?? ""}/Свойства.yaml`, `Не найден владелец ${formatOwnerRef(ref)}`)],
  }
}

function ownerKey(ref: OwnerTypeRef): string {
  return `${ref.kind}:${ref.name ?? ""}`
}

function formatOwnerRef(ref: OwnerTypeRef): string {
  return ref.name ? `${ref.kind}.${ref.name}` : ref.kind
}

function crossFileDiagnostic(filePath: string, message: string): Diagnostic {
  return { filePath, line: 1, col: 1, severity: "error", source: "cross-file", message }
}
```

- [ ] **Step 7: Run binary owner tests**

Run:

```bash
pnpm --filter @nakidka/core test -- sharedValidationBinaryOwners.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 2**

```bash
git add packages/core/metadata/validation/sharedValidationBinaryOwners.ts packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts
git commit -m "perf: :zap: добавить бинарный owner snapshot validation"
```

---

### Task 3: Snapshot Format Selection

**Files:**
- Modify: `packages/core/metadata/validation/sharedValidationSnapshot.ts`
- Modify: `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts`
- Modify: `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`

- [ ] **Step 1: Add tests for binary format selection**

Append this test to `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`:

```ts
  it("uses binary owner snapshot when NKDK_VALIDATION_SHARED_OWNER_FORMAT=binary", () => {
    const previous = process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"]
    process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"] = "binary"
    try {
      const table = createValidationObjectTable({
        records: [catalogRecord()],
        filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
      })
      const shared = createSharedValidationSnapshot(table.snapshot())

      expect(shared.owners.format).toBe("binary")
      expect(shared.owners.bytes).toBeGreaterThan(0)
    } finally {
      if (previous === undefined) delete process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"]
      else process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"] = previous
    }
  })
```

- [ ] **Step 2: Run the failing format selection test**

Run:

```bash
pnpm --filter @nakidka/core test -- sharedValidationSnapshot.test.ts
```

Expected: FAIL because `owners.format` does not exist.

- [ ] **Step 3: Modify `SharedValidationSnapshot` to support JSON and binary owners**

In `packages/core/metadata/validation/sharedValidationSnapshot.ts`, import the binary builder and change the owner type:

```ts
import { createBinarySharedOwnersSnapshot, type BinarySharedOwnersSnapshot } from "./sharedValidationBinaryOwners"
```

Replace the `owners` property in `SharedValidationSnapshot`:

```ts
export interface JsonSharedOwnersSnapshot {
  format: "json"
  buffer: SharedArrayBuffer
  bytes: number
  records: number
  files: number
}

export interface SharedValidationSnapshot {
  reference: SharedProjectReferenceSnapshot
  owners: JsonSharedOwnersSnapshot | BinarySharedOwnersSnapshot
}
```

In `createSharedValidationSnapshot`, replace direct JSON creation with:

```ts
  const owners =
    process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"] === "binary"
      ? createBinarySharedOwnersSnapshot(snapshot)
      : createJsonSharedOwnersSnapshot(snapshot)

  return {
    reference: createSharedProjectReferenceSnapshot({
      objectIndexEntries: snapshot.objectIndexEntries ?? [],
      memberIndexEntries: snapshot.memberIndexEntries ?? [],
      valueIndexEntries: snapshot.valueIndexEntries ?? [],
    }),
    owners,
  }
```

Move existing JSON payload creation into:

```ts
function createJsonSharedOwnersSnapshot(snapshot: ValidationObjectTableSnapshot): JsonSharedOwnersSnapshot {
  const payload: SharedOwnersPayload = {
    records: snapshot.records.filter((record) => record.ownerRef !== undefined).map(encodeOwnerRecord),
    filePaths: snapshot.filePaths,
  }
  const json = JSON.stringify(payload)
  const bytes = textEncoder.encode(json)
  const buffer = new SharedArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return { format: "json", buffer, bytes: bytes.byteLength, records: payload.records.length, files: payload.filePaths.length }
}
```

Update `decodeSharedValidationOwners` to reject binary explicitly:

```ts
export function decodeSharedValidationOwners(snapshot: SharedValidationSnapshot): SharedOwnersPayload {
  if (snapshot.owners.format !== "json") throw new Error("Shared owner snapshot не является JSON snapshot")
  const decoded = JSON.parse(textDecoder.decode(new Uint8Array(snapshot.owners.buffer))) as Partial<SharedOwnersPayload>
  if (!Array.isArray(decoded.records) || !Array.isArray(decoded.filePaths)) {
    throw new Error(`Некорректный shared owner snapshot: keys=${Object.keys(decoded).join(",")} records=${typeof decoded.records}`)
  }
  return { records: decoded.records, filePaths: decoded.filePaths }
}
```

- [ ] **Step 4: Route shared owner cache by format**

Modify `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts`:

```ts
import { createOwnerMetadataCacheFromBinarySharedOwners } from "../sharedValidationBinaryOwners"
```

At the start of `createOwnerMetadataCacheFromSharedValidationSnapshot`, add:

```ts
  if (params.snapshot.owners.format === "binary") {
    return createOwnerMetadataCacheFromBinarySharedOwners({
      projectDir: params.projectDir,
      snapshot: params.snapshot.owners,
    })
  }
```

Keep the existing JSON code below this branch.

- [ ] **Step 5: Run snapshot and owner tests**

Run:

```bash
pnpm --filter @nakidka/core test -- sharedValidationSnapshot.test.ts sharedValidationBinaryOwners.test.ts sharedStringPool.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add packages/core/metadata/validation/sharedValidationSnapshot.ts packages/core/metadata/validation/dataPath/sharedOwnerCache.ts packages/core/metadata/validation/sharedValidationSnapshot.test.ts
git commit -m "perf: :zap: включить бинарный формат shared owners"
```

---

### Task 4: Worker Integration and Validation Profile

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `docs/superpowers/plans/2026-07-02-validation-binary-shared-snapshot.md`

- [ ] **Step 1: Ensure profile logs owner format**

In `packages/core/metadata/validation/projectValidationWorkerPool.ts`, extend `logSecondPassPoolProfile` params:

```ts
ownerFormat?: string
```

Pass it from `runSecondPass`:

```ts
ownerFormat: sharedValidationSnapshot?.owners.format,
```

Add it to the logged fields:

```ts
...(params.ownerFormat === undefined ? [] : [`ownerFormat=${params.ownerFormat}`]),
```

- [ ] **Step 2: Run focused worker tests**

Run:

```bash
pnpm --filter @nakidka/core test -- projectValidationWorkerPool.test.ts validateProject.test.ts sharedValidationSnapshot.test.ts sharedValidationBinaryOwners.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full validation with binary shared owners**

Run:

```bash
/usr/bin/time -p env NKDK_VALIDATION_TIMING=1 NKDK_VALIDATION_PROFILE=1 NKDK_VALIDATION_SHARED_SECOND_PASS=1 NKDK_VALIDATION_SHARED_OWNER_FORMAT=binary pnpm --filter @nakidka/cli dev validate /Users/nikita/git/nkdk-yaml
```

Expected:

- `summary: 0 error, 0 warning`
- profile contains `ownerFormat=binary`
- profile contains `sharedOwnerBytes=<number>`
- profile contains `secondPassWall=<number>ms`

- [ ] **Step 4: Run full validation with JSON shared owners**

Run:

```bash
/usr/bin/time -p env NKDK_VALIDATION_TIMING=1 NKDK_VALIDATION_PROFILE=1 NKDK_VALIDATION_SHARED_SECOND_PASS=1 NKDK_VALIDATION_SHARED_OWNER_FORMAT=json pnpm --filter @nakidka/cli dev validate /Users/nikita/git/nkdk-yaml
```

Expected:

- `summary: 0 error, 0 warning`
- profile contains `ownerFormat=json`
- profile contains `sharedOwnerBytes=<number>`
- profile contains `secondPassWall=<number>ms`

- [ ] **Step 5: Update this plan with measured results**

In this file, add a `## Measurement` section with:

Use the exact values printed by the two commands from Steps 3 and 4. Do not estimate them from memory. The section must include `summary`, `real`, `secondPassWall`, `snapshot`, `workerWall`, and `sharedOwnerBytes` for both runs, plus one sentence saying whether binary is faster, slower, or neutral.

- [ ] **Step 6: Commit Task 4**

```bash
git add packages/core/metadata/validation/projectValidationWorkerPool.ts docs/superpowers/plans/2026-07-02-validation-binary-shared-snapshot.md
git commit -m "perf: :zap: профилировать бинарный shared owner snapshot"
```

---

### Task 5: Final Verification

**Files:**
- Modify only if verification exposes a bug.

- [ ] **Step 1: Run full project tests**

Run:

```bash
pnpm test
```

Expected:

- core tests pass;
- cli tests pass;
- mcp tests pass.

- [ ] **Step 2: Check git status**

Run:

```bash
git status --short
```

Expected: no uncommitted changes, or only the plan checkbox updates from this verification task.

- [ ] **Step 3: Commit final plan checkbox update if needed**

If only this plan changed, run:

```bash
git add docs/superpowers/plans/2026-07-02-validation-binary-shared-snapshot.md
git commit -m "docs: :memo: обновить план binary shared snapshot"
```

Expected: commit created, or skip if the tree is clean.

---

## Notes for Execution

- Keep `NKDK_VALIDATION_SHARED_SECOND_PASS` opt-in until the profile proves the binary owner snapshot is faster.
- Do not move parsed YAML, imported full model, or `ProjectValidationFileState` into shared memory.
- If a real validation error shows that a data path needs extra `model` data, add a narrow binary fact for that query instead of storing the whole model.
- If table source columns fail in full validation, extend `FIELD_INTS` to include real `columnStart/columnCount` and update the tests before changing production behavior.
