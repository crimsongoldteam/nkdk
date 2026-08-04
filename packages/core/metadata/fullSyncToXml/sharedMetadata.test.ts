import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { discoverFullXmlSyncPlan } from "./discovery"
import {
  createFullXmlSyncCompositionReader,
  createFullXmlSyncCompositionSnapshot,
} from "./sharedMetadata"
import type { FullXmlSyncAssignment } from "./types"

describe("full sync shared composition", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("shares project composition through one SharedArrayBuffer", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-full-sync-shared-"))
    tempDirs.push(projectDir)
    const owner = join(projectDir, "Справочник", "Товары")
    const form = join(owner, "Формы", "ФормаЭлемента")
    mkdirSync(form, { recursive: true })
    writeFileSync(join(owner, "Свойства.yaml"), "Имя: Товары\n")
    writeFileSync(join(form, "Форма.yaml"), "Имя: ФормаЭлемента\n")
    const plan = await discoverFullXmlSyncPlan(projectDir)

    const shared = createFullXmlSyncCompositionSnapshot(plan.assignments)
    const left = createFullXmlSyncCompositionReader(shared)
    const right = createFullXmlSyncCompositionReader(shared)

    expect(shared.table).toBeInstanceOf(SharedArrayBuffer)
    expect(left.assignments()).toEqual(right.assignments())
    expect(left.assignment(
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    )).toMatchObject({
      role: "form",
      ownerLogicalAddress: "Справочник.Товары",
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    expect(
      left.assignmentsByOwner("Справочник.Товары").map(({ itemName }) => itemName)
    ).toEqual(["ФормаЭлемента"])
  })

  it("находит только детей владельца и сохраняет предметный порядок при коллизии", () => {
    const assignments = [
      assignment({
        id: "Конфигурация.yaml",
        itemName: "Конфигурация",
        itemType: "MetadataConfiguration",
        logicalAddress: "Конфигурация",
        role: "configuration",
      }),
      assignment({
        id: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
        itemName: "ФормаСписка",
        logicalAddress: "Справочник.Товары.Форма.ФормаСписка",
        ownerLogicalAddress: "Справочник.Товары",
        role: "form",
      }),
      assignment({
        id: "Справочник/Услуги/Формы/ФормаЭлемента/Форма.yaml",
        itemName: "ФормаЭлемента",
        logicalAddress: "Справочник.Услуги.Форма.ФормаЭлемента",
        ownerLogicalAddress: "Справочник.Услуги",
        role: "form",
      }),
      assignment({
        id: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        itemName: "ФормаЭлемента",
        logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
        ownerLogicalAddress: "Справочник.Товары",
        role: "form",
      }),
      assignment({
        id: "Справочник/Товары/Свойства.yaml",
        itemName: "Товары",
        logicalAddress: "Справочник.Товары",
        role: "properties",
      }),
    ]
    const hashOwner = () => 7n
    const shared = createFullXmlSyncCompositionSnapshot(assignments, { hashOwner })
    const left = createFullXmlSyncCompositionReader(shared, { hashOwner })
    const right = createFullXmlSyncCompositionReader(shared, { hashOwner })

    expect(shared.ownerLookup.slots).toBeInstanceOf(SharedArrayBuffer)
    expect(left.children("Справочник.Товары").map(({ itemName }) => itemName)).toEqual([
      "ФормаСписка",
      "ФормаЭлемента",
    ])
    expect(left.children("Справочник.Услуги").map(({ itemName }) => itemName)).toEqual([
      "ФормаЭлемента",
    ])
    expect(left.children("Справочник.Нет")).toEqual([])
    expect(left.children("Конфигурация").map(({ itemName }) => itemName)).toEqual(["Товары"])
    expect(left.itemTypeByYamlDir()).toEqual({ Справочник: "MetadataCatalog" })
    expect(right.children("Справочник.Товары")).toEqual(left.children("Справочник.Товары"))
  })
})

function assignment(params: {
  id: string
  itemName: string
  logicalAddress: string
  itemType?: string
  ownerLogicalAddress?: string
  role: FullXmlSyncAssignment["role"]
}): FullXmlSyncAssignment {
  return {
    id: params.id,
    sourceProjectPath: params.id,
    sourcePath: `/project/${params.id}`,
    expectedContentHash: 1n,
    role: params.role,
    itemType: params.itemType ?? "MetadataCatalog",
    itemName: params.itemName,
    logicalAddress: params.logicalAddress,
    ...(params.ownerLogicalAddress === undefined
      ? {}
      : {
          owner: {
            itemType: "MetadataCatalog",
            name: params.ownerLogicalAddress.split(".").at(-1)!,
            logicalAddress: params.ownerLogicalAddress,
          },
        }),
    nodeId: "test",
    potentialOutputs: [],
  }
}
