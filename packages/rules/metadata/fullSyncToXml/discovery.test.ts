import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { hashConfigurationProjectFileList } from "../configurationIndex"
import { readComponentProjectStructure } from "../project/componentState/structure"
import { buildFullXmlSyncPlan } from "./discovery"

describe("full XML sync discovery", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-full-sync-discovery-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  function touch(projectDir: string, projectPath: string): void {
    const filePath = join(projectDir, "cf", ...projectPath.split("/"))
    mkdirSync(resolve(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "")
  }

  async function buildPlan(projectDir: string) {
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const hashes = {
      componentPath: structure.componentPath,
      projectFiles: await hashConfigurationProjectFileList(structure.componentDir, structure.projectPaths),
    }
    return buildFullXmlSyncPlan({ structure, hashes })
  }

  it("creates assignments for YAML and external file plans without reading YAML contents", async () => {
    const projectDir = createProject()
    touch(projectDir, "Конфигурация.yaml")
    touch(projectDir, "Справочник/Товары/Свойства.yaml")
    touch(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml")
    touch(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl")

    const plan = await buildPlan(projectDir)

    expect(plan.assignments.map((assignment) => assignment.sourceProjectPath)).toEqual([
      "Конфигурация.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    ])
    expect(plan.assignments[0]).toMatchObject({
      role: "configuration",
      itemType: "MetadataConfiguration",
      itemName: "Конфигурация",
      logicalAddress: "Конфигурация",
      potentialOutputs: expect.arrayContaining([expect.objectContaining({ targetXmlPath: "Configuration.xml" })]),
    })
    expect(plan.assignments[1]).toMatchObject({
      role: "properties",
      itemType: "MetadataCatalog",
      itemName: "Товары",
      logicalAddress: "Справочник.Товары",
      potentialOutputs: expect.arrayContaining([
        expect.objectContaining({ targetXmlPath: "Catalogs/Товары.xml" }),
        expect.objectContaining({
          targetXmlPath: "Catalogs/Товары/Ext/AdditionalIndexes.xml",
          propertyName: "additionalIndexes",
        }),
      ]),
    })
    expect(plan.assignments[2]).toMatchObject({
      role: "form",
      itemType: "ClientApplicationForm",
      itemName: "ФормаЭлемента",
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
      owner: { itemType: "MetadataCatalog", name: "Товары", logicalAddress: "Справочник.Товары" },
      potentialOutputs: expect.arrayContaining([
        expect.objectContaining({ targetXmlPath: "Catalogs/Товары/Forms/ФормаЭлемента.xml" }),
      ]),
    })
    expect(plan.externalFiles).toEqual([
      expect.objectContaining({
        sourceProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
        sourcePath: join(projectDir, "cf", "Справочник", "Товары", "Формы", "ФормаЭлемента", "Модуль.bsl"),
        targetXmlPath: "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
        transferCapabilityId: "ChildFormNames",
      }),
    ])
  })

  it("plans metadata and body XML for one common form assignment", async () => {
    const projectDir = createProject()
    touch(projectDir, "ОбщаяФорма/Additional/Свойства.yaml")

    const plan = await buildPlan(projectDir)

    expect(plan.assignments[0]?.potentialOutputs?.map((output) => output.targetXmlPath)).toEqual([
      "CommonForms/Additional.xml",
      "CommonForms/Additional/Ext/Form.xml",
      "CommonForms/Additional/Ext/Help.xml",
    ])
  })

  it("uses semantic logical-address segments for recursively nested objects", async () => {
    const projectDir = createProject()
    touch(projectDir, "Подсистема/Родитель/Свойства.yaml")
    touch(projectDir, "Подсистема/Родитель/Подсистемы/Потомок/Свойства.yaml")

    const plan = await buildPlan(projectDir)

    expect(
      plan.assignments.find(
        (assignment) =>
          assignment.sourceProjectPath ===
          "Подсистема/Родитель/Подсистемы/Потомок/Свойства.yaml"
      )
    ).toMatchObject({
      sourceProjectPath: "Подсистема/Родитель/Подсистемы/Потомок/Свойства.yaml",
      logicalAddress: "Подсистема.Родитель.Подсистема.Потомок",
      owner: {
        name: "Родитель",
        logicalAddress: "Подсистема.Родитель",
      },
    })
  })
})
