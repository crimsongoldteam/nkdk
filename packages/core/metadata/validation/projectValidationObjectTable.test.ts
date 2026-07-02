import { describe, expect, it } from "vitest"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationObjectRecord } from "./projectValidationTypes"

describe("ValidationObjectTable", () => {
  it("resolves owner records by kind and name", () => {
    const table = createValidationObjectTable()
    table.mergeRecords([record({ kind: "Справочник", name: "Товары" })])

    expect(table.getOwner({ kind: "Справочник", name: "Товары" })?.filePath).toBe(
      "/project/Справочник/Товары/Свойства.yaml"
    )
  })

  it("returns undefined for missing owners", () => {
    const table = createValidationObjectTable()

    expect(table.getOwner({ kind: "Справочник", name: "НеСуществует" })).toBeUndefined()
  })

  it("preserves all file paths in snapshots when owner keys collide", () => {
    const table = createValidationObjectTable()
    const first = record(
      { kind: "Подсистема", name: "Настройки" },
      "/project/Подсистема/A/Подсистемы/Настройки/Свойства.yaml"
    )
    const second = record(
      { kind: "Подсистема", name: "Настройки" },
      "/project/Подсистема/B/Подсистемы/Настройки/Свойства.yaml"
    )
    table.mergeRecords([first, second])

    const restored = createValidationObjectTable(table.snapshot())

    expect(restored.hasFile(first.filePath)).toBe(true)
    expect(restored.hasFile(second.filePath)).toBe(true)
    expect(restored.getOwner({ kind: "Подсистема", name: "Настройки" })?.filePath).toBe(second.filePath)
  })

  it("includes reference index entries in snapshots", () => {
    const table = createValidationObjectTable()
    table.mergeRecords([
      {
        ...record({ kind: "Справочник", name: "Товары" }),
        objectIndexEntries: [{ canonical: "Catalog.Товары", target: {} as never, result: { ok: true } }],
        valueIndexEntries: [{ canonical: "Catalog.Товары.EmptyRef", target: {} as never, result: { ok: true } }],
      },
    ])

    expect(table.snapshot()).toMatchObject({
      objectIndexEntries: [expect.objectContaining({ canonical: "Catalog.Товары" })],
      valueIndexEntries: [expect.objectContaining({ canonical: "Catalog.Товары.EmptyRef" })],
    })
  })

  it("preserves reference index entries without owner records", () => {
    const table = createValidationObjectTable()
    table.mergeReferenceIndexEntries({
      memberIndexEntries: [{ canonical: "Catalog.Товары.Form.ФормаЭлемента", target: {} as never, result: { ok: true } }],
    })

    const restored = createValidationObjectTable(table.snapshot())

    expect(restored.snapshot()).toMatchObject({
      memberIndexEntries: [expect.objectContaining({ canonical: "Catalog.Товары.Form.ФормаЭлемента" })],
    })
  })
})

function record(owner: { kind: string; name: string }, filePath?: string): ValidationObjectRecord {
  const resolvedFilePath = filePath ?? `/project/${owner.kind}/${owner.name}/Свойства.yaml`

  return {
    filePath: resolvedFilePath,
    projectPath: resolvedFilePath.replace(/^\/project\//, ""),
    kind: "properties",
    owner: { dir: owner.kind, name: owner.name },
    ownerRef: { kind: owner.kind, name: owner.name },
    model: { itemType: owner.kind, name: owner.name },
    importDiagnostics: [],
  }
}
