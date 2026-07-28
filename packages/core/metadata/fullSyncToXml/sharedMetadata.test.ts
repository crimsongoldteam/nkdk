import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { discoverFullXmlSyncPlan } from "./discovery"
import {
  createFullXmlSyncCompositionReader,
  createFullXmlSyncCompositionSnapshot,
} from "./sharedMetadata"

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
})
