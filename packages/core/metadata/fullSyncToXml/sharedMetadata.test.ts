import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { extractValidationOwnerYamlFacts } from "../validation/yamlFactExtractor"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { buildFullXmlSyncPlan } from "./discovery"
import { createFullXmlSyncSharedMetadata, createFullXmlSyncSharedMetadataReader } from "./sharedMetadata"
import type { FullXmlSyncOwnerFacts } from "./types"

describe("full sync shared metadata", () => {
  const tempDirs: string[] = []
  const context = { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } } as const

  registerValidationMetadata()

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-full-sync-shared-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n")
    )
    writeFileSync(
      join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"),
      "Имя: ФормаЭлемента\n"
    )
    return projectDir
  }

  it("shares project composition through one SharedArrayBuffer", async () => {
    const projectDir = createProject()
    const plan = await buildFullXmlSyncPlan({ projectDir })
    const shared = createFullXmlSyncSharedMetadata({ assignments: plan.assignments, owners: [] })
    const left = createFullXmlSyncSharedMetadataReader(shared)
    const right = createFullXmlSyncSharedMetadataReader(shared)

    expect(shared.composition.table).toBeInstanceOf(SharedArrayBuffer)
    expect(shared.composition.table).toBe(shared.composition.table)
    expect(left.assignments()).toEqual(right.assignments())
    expect(left.assignment("Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml")).toMatchObject({
      role: "form",
      ownerLogicalAddress: "Справочник.Товары",
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    expect(left.assignmentsByOwner("Справочник.Товары").map((item) => item.itemName)).toEqual(["ФормаЭлемента"])
  })

  it("builds shared owner facts without running schema or reference validation", async () => {
    const projectDir = createProject()
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const sourcePath = join(projectDir, ...projectPath.split("/"))
    const prepared = prepareYamlFiles({
      files: [
        {
          projectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          itemType: "Catalog",
        },
      ],
      itemTypeByYamlDir: { Справочник: "Catalog" },
    })
    const file = resolveValidationProjectFile(projectDir, sourcePath)
    if (file === undefined) throw new Error("validation file was not resolved")
    const ownerFacts = extractValidationOwnerYamlFacts({
      file,
      data: prepared.yamlFiles[0]?.data,
      rulesSnapshot: createValidationRulesSnapshot(context),
    })
    const owners: FullXmlSyncOwnerFacts[] = [
      {
        assignmentId: projectPath,
        sourceProjectPath: projectPath,
        sourcePath,
        role: "properties",
        owner: { dir: "Справочник", name: "Товары" },
        itemType: "Catalog",
        ...(ownerFacts?.ownerFacts === undefined ? {} : { ownerFacts: ownerFacts.ownerFacts }),
        ...(ownerFacts?.fieldIndex === undefined ? {} : { fieldIndex: ownerFacts.fieldIndex }),
      },
    ]
    const plan = await buildFullXmlSyncPlan({ projectDir })
    const reader = createFullXmlSyncSharedMetadataReader(
      createFullXmlSyncSharedMetadata({ assignments: plan.assignments, owners })
    )
    const owner = reader.ownerCache(projectDir).get({ kind: "Справочник", name: "Товары" })

    expect(owner.status).toBe("ok")
    if (owner.status !== "ok") throw new Error("owner facts were not resolved")
    expect(owner.owner.fieldIndex.fields.get("Артикул")).toMatchObject({ name: "Артикул", kind: "attribute" })
  })
})
