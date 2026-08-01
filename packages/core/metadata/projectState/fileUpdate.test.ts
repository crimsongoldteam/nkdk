import { describe, expect, it } from "vitest"
import type { DataPathPropertyRule } from "../orchestration/property/types"
import { toDataPathPolicyInput } from "../validation/dataPath/policies"
import {
  assertProjectStateFileUpdateBatch,
  createProjectStateFileUpdateBatch,
  type ProjectStateFileUpdate,
  type ProjectStateFileUpdateBatch,
} from "./fileUpdate"

describe("ProjectStateFileUpdateBatch", () => {
  it("keeps only the portable DataPath policy fields", () => {
    const rule = {
      yaml: "ПутьКДанным",
      type: "DataPath",
      allowedKinds: ["boolean", "scalar"],
      allowComposite: true,
      defaultType: "boolean",
      callback: () => "must not cross the boundary",
    } satisfies DataPathPropertyRule & { callback: () => string }

    expect(toDataPathPolicyInput(rule)).toEqual({
      yaml: "ПутьКДанным",
      allowedKinds: ["boolean", "scalar"],
      allowComposite: true,
    })
  })

  it("owns one big-endian hash buffer and survives cloning and transfer", () => {
    const batch = createProjectStateFileUpdateBatch([
      { update: resourceUpdate("cf/Модуль.bsl"), hash: 0x0102_0304_0506_0708n },
      {
        update: yamlUpdate("cf/Конфигурация.yaml"),
        hashBytes: Uint8Array.from([0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18]),
      },
    ])

    expect([...batch.hashBytes]).toEqual([
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
    ])
    expect(batch.hashBytes.byteOffset).toBe(0)
    expect(batch.hashBytes.byteLength).toBe(batch.hashBytes.buffer.byteLength)
    expect(structuredClone(batch)).toEqual(batch)
    expect(() => assertProjectStateFileUpdateBatch(batch)).not.toThrow()

    const transferable = structuredClone(batch)
    const transferred = structuredClone(transferable, { transfer: [transferable.hashBytes.buffer as ArrayBuffer] })
    expect(transferable.hashBytes.byteLength).toBe(0)
    expect(transferred).toEqual(batch)
  })

  it.each([
    ["short view", new Uint8Array(15)],
    ["long view", new Uint8Array(17)],
    ["non-owning view", new Uint8Array(new ArrayBuffer(17), 1, 16)],
    ["oversized backing buffer", new Uint8Array(new ArrayBuffer(17), 0, 16)],
  ])("rejects %s", (_name, hashBytes) => {
    expect(() =>
      assertProjectStateFileUpdateBatch({
        updates: [resourceUpdate("a.bin"), resourceUpdate("b.bin")],
        hashBytes,
      })
    ).toThrow()
  })

  it.each([
    ["hash", { hash: 1n }],
    ["hashOffset", { hashOffset: 0 }],
    ["rule object", { rule: { type: "DataPath", yaml: "ПутьКДанным" } }],
    ["parsed YAML", { parsed: { data: {} } }],
    ["project graph", { graph: { layers: [] } }],
    ["function", { callback: () => undefined }],
  ])("rejects forbidden %s inside an update", (_name, forbidden) => {
    const update = { ...yamlUpdate("cf/Конфигурация.yaml"), ...forbidden }
    const batch = {
      updates: [update],
      hashBytes: new Uint8Array(8),
    } as unknown as ProjectStateFileUpdateBatch

    expect(() => assertProjectStateFileUpdateBatch(batch)).toThrow()
  })

  it.each([
    ["reference type", { references: [{ kind: "object", canonical: 7 }] }],
    ["owner type", { owners: [{ owner: { kind: 7 }, facts: {} }] }],
    [
      "form source type",
      { forms: [{ kind: "root", owner: { kind: "Справочник", name: "Товары" }, name: "Объект", source: {} }] },
    ],
    [
      "pending policy type",
      {
        pendingChecks: [
          {
            kind: "dataPath",
            location: { line: 1, col: 1 },
            owner: { kind: "Справочник", name: "Товары" },
            value: "Объект",
            policyInput: { yaml: 1 },
            policy: "formDataPath",
          },
        ],
      },
    ],
  ])("rejects malformed allowed fields: %s", (_name, malformed) => {
    const batch = {
      updates: [{ ...yamlUpdate("cf/Конфигурация.yaml"), ...malformed }],
      hashBytes: new Uint8Array(8),
    }

    expect(() => assertProjectStateFileUpdateBatch(batch)).toThrow()
  })

  it.each([
    ["short source hash", { update: resourceUpdate("a.bin"), hashBytes: new Uint8Array(7) }],
    ["negative hash", { update: resourceUpdate("a.bin"), hash: -1n }],
    ["overflow hash", { update: resourceUpdate("a.bin"), hash: 1n << 64n }],
  ])("rejects invalid source hash: %s", (_name, entry) => {
    expect(() => createProjectStateFileUpdateBatch([entry])).toThrow()
  })

  it("accepts both uint64 hash boundaries", () => {
    const batch = createProjectStateFileUpdateBatch([
      { update: resourceUpdate("zero.bin"), hash: 0n },
      { update: resourceUpdate("max.bin"), hash: (1n << 64n) - 1n },
    ])

    expect([...batch.hashBytes]).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0,
      255, 255, 255, 255, 255, 255, 255, 255,
    ])
  })

  it.each([
    ["updates type", { updates: {}, hashBytes: new Uint8Array(0) }],
    ["hash view type", { updates: [], hashBytes: new ArrayBuffer(0) }],
    ["unknown update kind", { updates: [{ ...resourceUpdate("a.bin"), kind: "other" }], hashBytes: new Uint8Array(8) }],
    [
      "wrong resource kind",
      { updates: [{ ...resourceUpdate("a.bin"), resourceKind: "yaml" }], hashBytes: new Uint8Array(8) },
    ],
    [
      "missing YAML role",
      { updates: [{ ...yamlUpdate("a.yaml"), yamlRole: undefined }], hashBytes: new Uint8Array(8) },
    ],
    [
      "diagnostic type",
      {
        updates: [
          {
            ...yamlUpdate("a.yaml"),
            localValidation: {
              contributedFacts: true,
              diagnostics: [{ line: "1", col: 1, severity: "error", source: "structure", message: "x" }],
              schemaDiagnostics: [],
            },
          },
        ],
        hashBytes: new Uint8Array(8),
      },
    ],
    ["dependency type", { updates: [{ ...yamlUpdate("a.yaml"), dependencies: [1] }], hashBytes: new Uint8Array(8) }],
  ])("rejects malformed batch shape: %s", (_name, batch) => {
    expect(() => assertProjectStateFileUpdateBatch(batch)).toThrow()
  })

  it("rejects non-plain nested data", () => {
    const batch = {
      updates: [{ ...yamlUpdate("a.yaml"), owners: [{ owner: { kind: "Справочник" }, facts: new Date() }] }],
      hashBytes: new Uint8Array(8),
    }
    expect(() => assertProjectStateFileUpdateBatch(batch)).toThrow()
  })

  it.each([
    ["unknown YAML role", { yamlRole: "unknown" }],
    ["unknown reference kind", { references: [{ kind: "unknown", canonical: "Catalog.Товары" }] }],
    [
      "unknown field kind",
      {
        fields: [{
          owner: { kind: "Справочник", name: "Товары" },
          name: "Код",
          kind: "unknown",
          typeInfo: { kinds: ["scalar"], nextTypes: [] },
        }],
      },
    ],
    ["unknown form kind", { forms: [{ kind: "unknown" }] }],
    [
      "unknown pending-check kind",
      {
        pendingChecks: [{
          kind: "unknown",
          location: { line: 1, col: 1 },
          owner: { kind: "Справочник", name: "Товары" },
          value: "Объект",
          policyInput: { yaml: "ПутьКДанным" },
          policy: "formDataPath",
        }],
      },
    ],
  ])("rejects unknown DTO discriminants: %s", (_name, malformed) => {
    const batch = {
      updates: [{ ...yamlUpdate("a.yaml"), ...malformed }],
      hashBytes: new Uint8Array(8),
    }

    expect(() => assertProjectStateFileUpdateBatch(batch)).toThrow()
  })
})

function resourceUpdate(projectPath: string): ProjectStateFileUpdate {
  return {
    kind: "resource",
    projectPath,
    componentPath: "cf",
    resourceKind: "resource",
  }
}

function yamlUpdate(projectPath: string): ProjectStateFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: [],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}
