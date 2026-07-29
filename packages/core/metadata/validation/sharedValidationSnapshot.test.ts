import { describe, expect, it } from "vitest"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import {
  createOwnerMetadataCacheFromSharedProjectValidationGraph,
  createOwnerMetadataCacheFromSharedValidationSnapshot,
} from "./dataPath/sharedOwnerCache"
import { createProjectValidationGraph } from "./projectValidationGraph"
import { createSharedProjectValidationGraph, createSharedValidationSnapshot } from "./sharedValidationSnapshot"
import type { ComponentValidationLayer, ValidationObjectRecord } from "./projectValidationTypes"

describe("SharedValidationSnapshot", () => {
  it("restores owner field indexes for shared owner cache", () => {
    const table = createValidationObjectTable({
      records: [catalogRecord()],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
    })
    const shared = createSharedValidationSnapshot(table.snapshot())
    const regular = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })
    const sharedCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
      projectDir: "/project",
      snapshot: shared,
    })

    const regularOwner = regular.get({ kind: "Справочник", name: "Номенклатура" })
    const sharedOwner = sharedCache.get({ kind: "Справочник", name: "Номенклатура" })

    expect(shared.owners.bytes).toBeGreaterThan(0)
    expect(sharedOwner.status).toBe("ok")
    expect(sharedOwner).toMatchObject({ status: regularOwner.status })
    if (sharedOwner.status !== "ok" || regularOwner.status !== "ok") throw new Error("owner expected")
    expect([...sharedOwner.owner.fieldIndex.fields.entries()]).toEqual([
      ...regularOwner.owner.fieldIndex.fields.entries(),
    ])
    expect([...sharedOwner.owner.fieldIndex.standardAttributeAliases.entries()]).toEqual([
      ...regularOwner.owner.fieldIndex.standardAttributeAliases.entries(),
    ])
  })

  it("always uses binary owner snapshot", () => {
    const table = createValidationObjectTable({
      records: [catalogRecord()],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
    })
    const shared = createSharedValidationSnapshot(table.snapshot())

    expect(shared.owners.format).toBe("binary")
    expect(shared.owners.bytes).toBeGreaterThan(0)
  })

  it("round-trips component layers with local priority and isolation", () => {
    const graph = createProjectValidationGraph([
      componentLayer("cf", [namedCatalogRecord("Товары", "/project/cf/base.yaml")]),
      componentLayer("cfe/Продажи", [namedCatalogRecord("Товары", "/project/cfe/Продажи/sales.yaml")]),
      componentLayer("cfe/Склад", [namedCatalogRecord("Склады", "/project/cfe/Склад/warehouse.yaml")]),
    ])
    const shared = createSharedProjectValidationGraph(graph)
    const sales = createOwnerMetadataCacheFromSharedProjectValidationGraph({
      projectDir: "/project",
      componentPath: "cfe/Продажи",
      graph: shared,
    })

    expect(graph.layers).toHaveLength(3)
    expect(shared.owners.records).toBe(3)
    expect(sales.get({ kind: "Справочник", name: "Товары" })).toMatchObject({
      status: "ok",
      owner: { filePath: "/project/cfe/Продажи/sales.yaml" },
    })
    expect(sales.get({ kind: "Справочник", name: "Склады" })).toMatchObject({
      status: "not-found",
    })
  })
})

function componentLayer(componentPath: string, objectRecords: ValidationObjectRecord[]): ComponentValidationLayer {
  return {
    componentPath,
    contribution: {
      objectRecords,
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    },
  }
}

function namedCatalogRecord(name: string, filePath: string): ValidationObjectRecord {
  return {
    ...catalogRecord(),
    filePath,
    projectPath: `Справочник/${name}/Свойства.yaml`,
    owner: { dir: "Справочник", name },
    ownerRef: { kind: "Справочник", name },
  }
}

function catalogRecord(): ValidationObjectRecord {
  return {
    filePath: "/project/Справочник/Номенклатура/Свойства.yaml",
    projectPath: "Справочник/Номенклатура/Свойства.yaml",
    kind: "properties",
    owner: { dir: "Справочник", name: "Номенклатура" },
    ownerRef: { kind: "Справочник", name: "Номенклатура" },
    fieldIndex: {
      fields: new Map([
        [
          "Артикул",
          {
            name: "Артикул",
            kind: "attribute",
            sourceCollection: "attributes",
            typeInfo: { kinds: ["scalar"] as const, nextTypes: [], sourceText: "String" },
          },
        ],
        [
          "Товары",
          {
            name: "Товары",
            kind: "tabularSection",
            sourceCollection: "tabularSections",
            typeInfo: {
              kinds: ["tableSource"] as const,
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
                    typeInfo: { kinds: ["scalar"] as const, nextTypes: [], sourceText: "Number" },
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
