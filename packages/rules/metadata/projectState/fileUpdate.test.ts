import { describe, expect, it } from "vitest"
import type { DataPathPropertyRule } from "@nkdk/runtime/rule-kit"
import { emptyYamlUpdate as yamlUpdate } from "./binary/testData"
import { toDataPathPolicyInput } from "../validation/dataPath/policies"
import {
  assertProjectStateFileUpdateBatch,
  createProjectStateFileUpdateBatch,
  isolateProjectStateYamlUpdate,
  type ProjectStateFileUpdate,
  type ProjectStateFileUpdateBatch,
} from "./fileUpdate"

describe("ProjectStateFileUpdateBatch", () => {
  it("оставляет у изолированного YAML только локальные schema diagnostics", () => {
    const schemaDiagnostic = {
      line: 1,
      col: 1,
      severity: "error" as const,
      source: "structure" as const,
      message: "schema",
    }
    const update = isolateProjectStateYamlUpdate({
      ...yamlUpdate("cfe/Расширение/БазоваяФорма.yaml"),
      componentPath: "cfe/Расширение",
      localValidation: {
        contributedFacts: true,
        diagnostics: [schemaDiagnostic, { ...schemaDiagnostic, message: "reference" }],
        schemaDiagnostics: [schemaDiagnostic],
      },
      targets: [{ kind: "member", canonical: "Catalog.Товары.Form.Форма" }],
      owners: [{ owner: { kind: "CatalogObject", name: "Товары" }, facts: {} }],
      pendingReferences: [{
        yamlPath: [],
        canonical: "Catalog.Товары",
        target: { kind: "object", root: "Catalog", objectName: "Товары" },
        constraint: { kind: "object", roots: ["Catalog"] },
      }],
      dependencies: ["Catalog.Товары"],
    })

    expect(update).toMatchObject({
      localValidation: {
        contributedFacts: true,
        diagnostics: [schemaDiagnostic],
        schemaDiagnostics: [schemaDiagnostic],
      },
      targets: [],
      owners: [],
      fields: [],
      forms: [],
      pendingReferences: [],
      pendingChecks: [],
      dependencies: [],
    })
  })

  it("переносит одну файловую цель через YAML- и resource-update", () => {
    const target = {
      kind: "member",
      canonical: "Document.Заказ.Template.Печать",
      fileBacked: {
        itemProjectPath: "cf/Документ/Заказ/Макеты/Печать",
        ownerProjectPath: "cf/Документ/Заказ/Свойства.yaml",
      },
    }
    const batch = {
      updates: [
        { ...resourceUpdate("cf/Документ/Заказ/Макеты/Печать/Template.xml"), targets: [target] },
        { ...yamlUpdate("cf/Документ/Заказ/Свойства.yaml"), targets: [target] },
      ],
      hashBytes: new Uint8Array(16),
    }

    expect(() => assertProjectStateFileUpdateBatch(batch)).not.toThrow()
    expect(structuredClone(batch)).toEqual(batch)
  })

  it("требует targets у resource-update", () => {
    expect(() => assertProjectStateFileUpdateBatch({
      updates: [{ kind: "resource", projectPath: "cf/file.bin", componentPath: "cf", resourceKind: "resource" }],
      hashBytes: new Uint8Array(8),
    })).toThrow("targets")
  })

  it.each([
    "/absolute/item",
    "../outside/item",
    "cf\\item",
  ])("отклоняет непереносимый путь файловой цели %s", (itemProjectPath) => {
    const update = {
      ...resourceUpdate("cf/file.bin"),
      targets: [{
        kind: "member",
        canonical: "Document.Заказ.Template.Печать",
        fileBacked: { itemProjectPath, ownerProjectPath: "cf/Документ/Заказ/Свойства.yaml" },
      }],
    }

    expect(() => assertProjectStateFileUpdateBatch({ updates: [update], hashBytes: new Uint8Array(8) })).toThrow()
  })

  it("keeps only the portable DataPath policy fields", () => {
    const rule = {
      yaml: "ПутьКДанным",
      type: "DataPath",
      allowedKinds: ["boolean", "decimal"],
      allowComposite: true,
      defaultType: "boolean",
      callback: () => "must not cross the boundary",
    } satisfies DataPathPropertyRule & { callback: () => string }

    expect(toDataPathPolicyInput(rule)).toEqual({
      yaml: "ПутьКДанным",
      allowedKinds: ["boolean", "decimal"],
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
    ["target type", { targets: [{ kind: "object", canonical: 7 }] }],
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
    ["строковое значение", { type: { type: ["DefinedType.А"] }, value: "Catalog.Товары.EmptyRef", tagged: true }],
    ["нестроковый itemType", { itemType: 1, type: { type: ["DefinedType.А"] }, value: { type: "ref", value: "" }, tagged: true }],
    ["неизвестная форма value", { type: { type: ["DefinedType.А"] }, value: {}, tagged: true }],
  ])("отклоняет повреждённую fillValue-проверку: %s", (_name, payload) => {
    const pendingCheck = {
      kind: "fillValue",
      yamlPath: ["Реквизиты", "А", "ЗначениеЗаполнения"],
      location: { line: 1, col: 1 },
      itemType: "MetadataAttribute",
      ...payload,
    }
    expect(() => assertProjectStateFileUpdateBatch({
      updates: [{ ...yamlUpdate("a.yaml"), pendingChecks: [pendingCheck] }],
      hashBytes: new Uint8Array(8),
    })).toThrow()
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

  it("rejects every binary value nested inside an update", () => {
    const targetWithBuffer = {
      kind: "object",
      root: "Catalog",
      objectName: "Товары",
      bytes: new ArrayBuffer(1),
    }
    const constraintWithTypedArray = {
      kind: "object",
      words: new Uint16Array(1),
    }
    const factsWithDataView = {
      owners: ["Catalog.Товары"],
      bytes: new DataView(new ArrayBuffer(1)),
    }
    const updates = [
      {
        ...yamlUpdate("a.yaml"),
        pendingReferences: [{
          yamlPath: [],
          canonical: "Catalog.Товары",
          target: targetWithBuffer,
          constraint: { kind: "object" },
        }],
      },
      {
        ...yamlUpdate("a.yaml"),
        pendingReferences: [{
          yamlPath: [],
          canonical: "Catalog.Товары",
          target: { kind: "object", root: "Catalog", objectName: "Товары" },
          constraint: constraintWithTypedArray,
        }],
      },
      {
        ...yamlUpdate("a.yaml"),
        owners: [{ owner: { kind: "Справочник", name: "Товары" }, facts: factsWithDataView }],
      },
    ]

    for (const update of updates) {
      expect(() => assertProjectStateFileUpdateBatch({ updates: [update], hashBytes: new Uint8Array(8) })).toThrow()
    }
  })

  it("rejects unknown and mistyped fields in nested reference and owner DTOs", () => {
    const pendingReference = {
      yamlPath: [],
      canonical: "Catalog.Товары",
      target: { kind: "object", root: "Catalog", objectName: "Товары" },
      constraint: { kind: "object" },
    }
    const updates = [
      { ...yamlUpdate("a.yaml"), pendingReferences: [{ ...pendingReference, target: { ...pendingReference.target, extra: true } }] },
      { ...yamlUpdate("a.yaml"), pendingReferences: [{ ...pendingReference, target: { ...pendingReference.target, root: 1 } }] },
      { ...yamlUpdate("a.yaml"), pendingReferences: [{ ...pendingReference, constraint: { kind: "object", extra: true } }] },
      { ...yamlUpdate("a.yaml"), pendingReferences: [{ ...pendingReference, constraint: { kind: "object", allowNested: "yes" } }] },
      { ...yamlUpdate("a.yaml"), pendingReferences: [{ ...pendingReference, tagged: "raw" }] },
      {
        ...yamlUpdate("a.yaml"),
        owners: [{ owner: { kind: "Справочник", name: "Товары" }, facts: { owners: ["Catalog.Товары"], extra: true } }],
      },
      {
        ...yamlUpdate("a.yaml"),
        owners: [{ owner: { kind: "Справочник", name: "Товары" }, facts: { owners: [1] } }],
      },
    ]

    for (const update of updates) {
      expect(() => assertProjectStateFileUpdateBatch({ updates: [update], hashBytes: new Uint8Array(8) })).toThrow()
    }
  })

  it("rejects unknown and mistyped fields in data-path and pending-check DTOs", () => {
    const owner = { kind: "Справочник", name: "Товары" }
    const typeInfo = { kinds: ["scalar"], nextTypes: [] }
    const field = { owner, name: "Код", kind: "attribute", typeInfo }
    const pendingCheck = {
      kind: "dataPath",
      yamlPath: ["ПутьКДанным"],
      location: { line: 1, col: 1 },
      owner,
      value: "Объект.Код",
      tagged: false,
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath",
    }
    const updates = [
      { ...yamlUpdate("a.yaml"), fields: [{ ...field, typeInfo: { ...typeInfo, extra: true } }] },
      { ...yamlUpdate("a.yaml"), fields: [{ ...field, typeInfo: { ...typeInfo, isComposite: "yes" } }] },
      { ...yamlUpdate("a.yaml"), fields: [{ ...field, typeInfo: { ...typeInfo, structuredType: 1 } }] },
      { ...yamlUpdate("a.yaml"), fields: [{ ...field, table: { kind: "ValueTable", extra: true } }] },
      {
        ...yamlUpdate("a.yaml"),
        forms: [{
          kind: "root",
          owner,
          name: "Объект",
          source: { kind: "formAttribute", name: "Объект", typeInfo, tableHasColumns: "yes" },
        }],
      },
      {
        ...yamlUpdate("a.yaml"),
        forms: [{
          kind: "additionalColumn",
          owner,
          tablePath: "Объект.Товары",
          name: "Количество",
          source: { name: "Количество", typeInfo, extra: true },
        }],
      },
      { ...yamlUpdate("a.yaml"), pendingChecks: [{ ...pendingCheck, elementType: "unknown" }] },
      { ...yamlUpdate("a.yaml"), pendingChecks: [{ ...pendingCheck, hasValuesPicture: "yes" }] },
      { ...yamlUpdate("a.yaml"), pendingChecks: [{ ...pendingCheck, tagged: "yes" }] },
      { ...yamlUpdate("a.yaml"), pendingChecks: [{ ...pendingCheck, tableContext: { dataPath: 1 } }] },
    ]

    for (const update of updates) {
      expect(() => assertProjectStateFileUpdateBatch({ updates: [update], hashBytes: new Uint8Array(8) })).toThrow()
    }
  })

  it("переносит structuredType источника данных формы", () => {
    const update = {
      ...yamlUpdate("a.yaml"),
      forms: [{
        kind: "root",
        owner: { kind: "Обработка", name: "Настройки" },
        name: "КомпоновщикНастроек",
        source: {
          kind: "formAttribute",
          name: "КомпоновщикНастроек",
          typeInfo: {
            kinds: ["structured"],
            nextTypes: [],
            structuredType: "DataCompositionSettingsComposer",
          },
        },
      }],
    }

    expect(() => assertProjectStateFileUpdateBatch({
      updates: [update],
      hashBytes: new Uint8Array(8),
    })).not.toThrow()
  })

  it.each([
    ["typeInfo.table", (registered: object) => ({
      fields: [{
        owner: { kind: "Справочник", name: "Товары" },
        name: "Код",
        kind: "attribute",
        typeInfo: { kinds: ["scalar"], nextTypes: [], table: registered },
      }],
    })],
    ["field.table", (registered: object) => ({
      fields: [{
        owner: { kind: "Справочник", name: "Товары" },
        name: "Код",
        kind: "attribute",
        typeInfo: { kinds: ["scalar"], nextTypes: [] },
        table: registered,
      }],
    })],
    ["form source.table", (registered: object) => ({
      forms: [{
        kind: "root",
        owner: { kind: "Справочник", name: "Товары" },
        name: "Объект",
        source: {
          kind: "formAttribute",
          name: "Объект",
          typeInfo: { kinds: ["scalar"], nextTypes: [] },
          table: registered,
        },
      }],
    })],
  ])("принимает Registered в %s", (_name, place) => {
    const update = {
      ...yamlUpdate("a.yaml"),
      ...place({ kind: "Registered", type: "DataCompositionSettingsComposer" }),
    }

    expect(() => assertProjectStateFileUpdateBatch({
      updates: [update],
      hashBytes: new Uint8Array(8),
    })).not.toThrow()
  })

  it.each([
    ["без type", { kind: "Registered" }],
    ["type не строка", { kind: "Registered", type: 1 }],
    ["лишнее поле", { kind: "Registered", type: "X", extra: true }],
    ["неизвестный kind", { kind: "Unknown", type: "X" }],
  ])("отклоняет неверный Registered: %s", (_name, table) => {
    const update = {
      ...yamlUpdate("a.yaml"),
      fields: [{
        owner: { kind: "Справочник", name: "Товары" },
        name: "Код",
        kind: "attribute",
        typeInfo: { kinds: ["scalar"], nextTypes: [], table },
      }],
    }

    expect(() => assertProjectStateFileUpdateBatch({
      updates: [update],
      hashBytes: new Uint8Array(8),
    })).toThrow()
  })

  it.each([
    ["unknown YAML role", { yamlRole: "unknown" }],
    ["unknown target kind", { targets: [{ kind: "unknown", canonical: "Catalog.Товары" }] }],
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

  it.each([
    { canonicalTarget: 1, missing: ["Имя"] },
    { canonicalTarget: "Catalog.Товары", missing: "Имя" },
    { canonicalTarget: "Catalog.Товары", missing: [1] },
  ])("rejects malformed addressableRequired payload: %o", (payload) => {
    expect(() => assertProjectStateFileUpdateBatch({
      updates: [{
        ...yamlUpdate("a.yaml"),
        pendingChecks: [{
          kind: "addressableRequired",
          yamlPath: [],
          location: { line: 1, col: 1 },
          ...payload,
        }],
      }],
      hashBytes: new Uint8Array(8),
    })).toThrow()
  })
})

function resourceUpdate(projectPath: string): ProjectStateFileUpdate {
  return {
    kind: "resource",
    projectPath,
    componentPath: "cf",
    resourceKind: "resource",
    targets: [],
  }
}
