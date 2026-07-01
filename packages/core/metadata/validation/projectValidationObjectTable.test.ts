import { describe, expect, it } from "vitest"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationObjectRecord } from "./projectValidationTypes"

describe("ValidationObjectTable", () => {
  it("resolves owner records by kind and name", () => {
    const table = createValidationObjectTable()
    table.mergeRecords([record({ kind: "Справочник", name: "Товары" })])

    expect(table.getOwner({ kind: "Справочник", name: "Товары" })?.filePath)
      .toBe("/project/Справочник/Товары/Свойства.yaml")
  })

  it("returns undefined for missing owners", () => {
    const table = createValidationObjectTable()

    expect(table.getOwner({ kind: "Справочник", name: "НеСуществует" })).toBeUndefined()
  })
})

function record(owner: { kind: string; name: string }): ValidationObjectRecord {
  return {
    filePath: `/project/${owner.kind}/${owner.name}/Свойства.yaml`,
    projectPath: `${owner.kind}/${owner.name}/Свойства.yaml`,
    kind: "properties",
    owner: { dir: owner.kind, name: owner.name },
    ownerRef: { kind: owner.kind, name: owner.name },
    model: { itemType: owner.kind, name: owner.name },
    importDiagnostics: [],
  }
}
