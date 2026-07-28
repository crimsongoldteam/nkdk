import { describe, expect, it } from "vitest"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedProjectValidationGraph } from "./dataPath/sharedOwnerCache"
import { createProjectValidationGraph } from "./projectValidationGraph"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ComponentValidationLayer, ValidationObjectRecord } from "./projectValidationTypes"
import { createSharedProjectValidationGraph } from "./sharedValidationSnapshot"
import {
  createBinarySharedOwnersSnapshot,
  createOwnerMetadataCacheFromBinarySharedOwners,
} from "./sharedValidationBinaryOwners"

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
    expect([...binaryOwner.owner.fieldIndex.fields.entries()]).toEqual([
      ...regularOwner.owner.fieldIndex.fields.entries(),
    ])
    expect([...binaryOwner.owner.fieldIndex.standardAttributeAliases.entries()]).toEqual([
      ...regularOwner.owner.fieldIndex.standardAttributeAliases.entries(),
    ])
    const binaryTable = binaryOwner.owner.fieldIndex.fields.get("Товары")
    const regularTable = regularOwner.owner.fieldIndex.fields.get("Товары")
    expect(binaryTable).toEqual(regularTable)
    expect(binaryOwner.owner.facts).toEqual(regularOwner.owner.facts)
  })

  it("returns not-found diagnostics for missing owners", () => {
    const table = createValidationObjectTable({ records: [], filePaths: [] })
    const snapshot = createBinarySharedOwnersSnapshot(table.snapshot())
    const binary = createOwnerMetadataCacheFromBinarySharedOwners({ projectDir: "/project", snapshot })

    expect(binary.get({ kind: "Справочник", name: "НетТакого" })).toMatchObject({ status: "not-found" })
  })

  it("lists owner refs by data path kind", () => {
    const secondRecord = {
      ...catalogRecord(),
      filePath: "/project/Справочник/Контрагенты/Свойства.yaml",
      projectPath: "Справочник/Контрагенты/Свойства.yaml",
      owner: { dir: "Справочник", name: "Контрагенты" },
      ownerRef: { kind: "Справочник", name: "Контрагенты" },
    } satisfies ValidationObjectRecord
    const table = createValidationObjectTable({
      records: [catalogRecord(), secondRecord],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml", secondRecord.filePath],
    })
    const snapshot = createBinarySharedOwnersSnapshot(table.snapshot())
    const regular = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })
    const binary = createOwnerMetadataCacheFromBinarySharedOwners({ projectDir: "/project", snapshot })

    expect(sortRefs(binary.listRefs("Справочник"))).toEqual(sortRefs(regular.listRefs("Справочник")))
  })

  it("restores owner model data used by data path resolvers", () => {
    const table = createValidationObjectTable({
      records: [
        {
          filePath: "/project/Константа/ИспользоватьСинхронизациюДанных/Свойства.yaml",
          projectPath: "Константа/ИспользоватьСинхронизациюДанных/Свойства.yaml",
          kind: "properties",
          owner: { dir: "Константа", name: "ИспользоватьСинхронизациюДанных" },
          ownerRef: { kind: "Константа", name: "ИспользоватьСинхронизациюДанных" },
          ownerFacts: {
            ref: { kind: "Константа", name: "ИспользоватьСинхронизациюДанных" },
            filePath: "/project/Константа/ИспользоватьСинхронизациюДанных/Свойства.yaml",
            fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
            type: { type: ["boolean"] },
          },
          fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
          importDiagnostics: [],
        },
      ],
      filePaths: ["/project/Константа/ИспользоватьСинхронизациюДанных/Свойства.yaml"],
    })
    const snapshot = createBinarySharedOwnersSnapshot(table.snapshot())
    const binary = createOwnerMetadataCacheFromBinarySharedOwners({ projectDir: "/project", snapshot })

    const owner = binary.get({ kind: "Константа", name: "ИспользоватьСинхронизациюДанных" })

    expect(owner.status).toBe("ok")
    if (owner.status !== "ok") throw new Error("owner expected")
    expect(owner.owner.facts).toMatchObject({ type: { type: ["boolean"] } })
  })

  it("restores compact owner facts without model payload", () => {
    const record = catalogRecord()
    const table = createValidationObjectTable({
      records: [
        {
          ...record,
          ownerFacts: {
            ref: { kind: "Справочник", name: "Номенклатура" },
            filePath: record.filePath,
            fieldIndex: record.fieldIndex!,
          },
          fieldIndex: undefined,
        },
      ],
      filePaths: [record.filePath],
    })
    const snapshot = createBinarySharedOwnersSnapshot(table.snapshot())
    const binary = createOwnerMetadataCacheFromBinarySharedOwners({ projectDir: "/project", snapshot })

    const owner = binary.get({ kind: "Справочник", name: "Номенклатура" })

    expect(owner.status).toBe("ok")
    if (owner.status !== "ok") throw new Error("owner expected")
    expect([...owner.owner.fieldIndex.fields.keys()]).toEqual(["Артикул", "Товары"])
  })

  it("resolves owners through visible component layers", () => {
    const graph = createSharedProjectValidationGraph(
      createProjectValidationGraph([
        ownerLayer("cf", [
          namedCatalogRecord("Товары", "/project/cf/base.yaml"),
          namedCatalogRecord("Контрагенты", "/project/cf/partners.yaml"),
        ]),
        ownerLayer("cfe/Продажи", [
          namedCatalogRecord("Товары", "/project/cfe/Продажи/sales.yaml"),
          namedCatalogRecord("Клиенты", "/project/cfe/Продажи/customers.yaml"),
        ]),
        ownerLayer("cfe/Склад", [
          namedCatalogRecord("Товары", "/project/cfe/Склад/warehouse.yaml"),
          namedCatalogRecord("Склады", "/project/cfe/Склад/warehouses.yaml"),
        ]),
      ])
    )
    const sales = createOwnerMetadataCacheFromSharedProjectValidationGraph({
      projectDir: "/project",
      componentPath: "cfe/Продажи",
      graph,
    })
    const base = createOwnerMetadataCacheFromSharedProjectValidationGraph({
      projectDir: "/project",
      componentPath: "cf",
      graph,
    })

    expect(sales.get({ kind: "Справочник", name: "Товары" })).toMatchObject({
      status: "ok",
      owner: { filePath: "/project/cfe/Продажи/sales.yaml" },
    })
    expect(base.get({ kind: "Справочник", name: "Товары" })).toMatchObject({
      status: "ok",
      owner: { filePath: "/project/cf/base.yaml" },
    })
    expect(sortRefs(sales.listRefs("Справочник"))).toEqual([
      { kind: "Справочник", name: "Клиенты" },
      { kind: "Справочник", name: "Контрагенты" },
      { kind: "Справочник", name: "Товары" },
    ])
  })
})

function ownerLayer(componentPath: string, objectRecords: ValidationObjectRecord[]): ComponentValidationLayer {
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

function sortRefs(refs: readonly { kind: string; name?: string }[]): Array<{ kind: string; name?: string }> {
  return [...refs].sort((left, right) =>
    `${left.kind}.${left.name ?? ""}`.localeCompare(`${right.kind}.${right.name ?? ""}`)
  )
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
            typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "String" },
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
                    typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "Number" },
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
