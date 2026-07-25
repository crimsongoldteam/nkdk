import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
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
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(resolve(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "")
  }

  it("creates assignments for YAML and external file plans without reading YAML contents", async () => {
    const projectDir = createProject()
    touch(projectDir, "Конфигурация.yaml")
    touch(projectDir, "Справочник/Товары/Свойства.yaml")
    touch(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml")
    touch(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl")

    const plan = await buildFullXmlSyncPlan({ projectDir })

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
      potentialOutputs: expect.arrayContaining([expect.objectContaining({ targetXmlPath: "Catalogs/Товары.xml" })]),
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
        sourcePath: join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Модуль.bsl"),
        targetXmlPath: "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
        transferCapabilityId: "ChildFormNames",
      }),
    ])
  })

  it("rejects duplicate XML targets before workers", async () => {
    const projectDir = createProject()
    touch(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml")

    await expect(
      buildFullXmlSyncPlan({
        projectDir,
        extraAssignments: [
          {
            id: "duplicate",
            sourceProjectPath: "duplicate.yaml",
            sourcePath: join(projectDir, "duplicate.yaml"),
            role: "form",
            itemType: "ClientApplicationForm",
            itemName: "ФормаЭлемента",
            logicalAddress: "Дубль",
            nodeId: "duplicate",
            potentialOutputs: [
              {
                declarationId: "duplicate",
                targetXmlPath: "Catalogs/Товары/Forms/ФормаЭлемента.xml",
                role: "metadata",
                required: true,
                prepareCapabilityId: "test",
              },
            ],
          },
        ],
      })
    ).rejects.toThrow("Повторный XML-путь")
  })

  it("plans metadata and body XML for one common form assignment", async () => {
    const projectDir = createProject()
    touch(projectDir, "ОбщаяФорма/Additional/Свойства.yaml")

    const plan = await buildFullXmlSyncPlan({ projectDir })

    expect(plan.assignments[0]?.potentialOutputs?.map((output) => output.targetXmlPath)).toEqual([
      "CommonForms/Additional.xml",
      "CommonForms/Additional/Ext/Form.xml",
    ])
  })
})
