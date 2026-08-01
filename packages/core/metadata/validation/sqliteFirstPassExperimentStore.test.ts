import { deserialize, serialize } from "node:v8"
import { describe, expect, it } from "vitest"
import {
  encodeSqliteFirstPassExperimentFile,
  type SqliteFirstPassExperimentFileRecord,
} from "./sqliteFirstPassExperimentProtocol"
import { createSqliteFirstPassExperimentStore } from "./sqliteFirstPassExperimentStore"

function experimentRecord(
  rootProjectPath: string,
  counts: Partial<SqliteFirstPassExperimentFileRecord["counts"]> = {},
): SqliteFirstPassExperimentFileRecord {
  const category = (count: number): Uint8Array =>
    serialize(Array.from({ length: count }, (_, index) => ({ index })))
  const resolvedCounts = {
    diagnostics: 0,
    objectRecords: 0,
    objectIndexEntries: 0,
    memberIndexEntries: 0,
    valueIndexEntries: 0,
    pendingReferences: 0,
    pendingChecks: 0,
    ...counts,
  }
  const record = {
    formatVersion: 1 as const,
    componentPath: "cf",
    rootProjectPath,
    contributedFacts: true,
    diagnostics: category(resolvedCounts.diagnostics),
    objectRecords: category(resolvedCounts.objectRecords),
    objectIndexEntries: category(resolvedCounts.objectIndexEntries),
    memberIndexEntries: category(resolvedCounts.memberIndexEntries),
    valueIndexEntries: category(resolvedCounts.valueIndexEntries),
    pendingReferences: category(resolvedCounts.pendingReferences),
    pendingChecks: category(resolvedCounts.pendingChecks),
    counts: resolvedCounts,
  }
  return {
    ...record,
    bytes: Object.values(record)
      .filter((value): value is Uint8Array => value instanceof Uint8Array)
      .reduce((total, value) => total + value.byteLength, 0),
  }
}

describe("SQLite first-pass experiment", () => {
  it("encodes every first-pass category independently", () => {
    const encoded = encodeSqliteFirstPassExperimentFile({
      componentPath: "cf",
      rootProjectPath: "cf/Конфигурация.yaml",
      contributedFacts: true,
      diagnostics: [{ message: "ошибка" }],
      objectRecords: [{ itemType: "Configuration" }],
      objectIndexEntries: [{ key: "Configuration" }],
      memberIndexEntries: [],
      valueIndexEntries: [{ value: "ru" }],
      pendingReferences: [{ target: "Catalog.Товары" }],
      pendingChecks: [{ kind: "form" }],
    })

    expect(encoded.counts).toEqual({
      diagnostics: 1,
      objectRecords: 1,
      objectIndexEntries: 1,
      memberIndexEntries: 0,
      valueIndexEntries: 1,
      pendingReferences: 1,
      pendingChecks: 1,
    })
    expect(deserialize(encoded.diagnostics)).toEqual([{ message: "ошибка" }])
    expect(deserialize(encoded.pendingChecks)).toEqual([{ kind: "form" }])
    expect(encoded.bytes).toBeGreaterThan(0)
  })

  it("stores one versioned contribution per project file", () => {
    const store = createSqliteFirstPassExperimentStore()
    store.append([
      experimentRecord("cf/Конфигурация.yaml", {
        objectRecords: 1,
        objectIndexEntries: 1,
        pendingReferences: 2,
      }),
      experimentRecord("cf/Справочник/Товары/Свойства.yaml", {
        objectRecords: 1,
        memberIndexEntries: 3,
        valueIndexEntries: 4,
      }),
    ])

    expect(store.finalize()).toMatchObject({
      files: 2,
      objectRecords: 2,
      objectIndexEntries: 1,
      memberIndexEntries: 3,
      valueIndexEntries: 4,
      pendingReferences: 2,
      quickCheck: "ok",
    })
  })

  it("rejects a second contribution for the same project path", () => {
    const store = createSqliteFirstPassExperimentStore()
    store.append([experimentRecord("cf/Конфигурация.yaml")])

    expect(() =>
      store.append([experimentRecord("cf/Конфигурация.yaml")]),
    ).toThrow()
    store.abort()
  })
})
