import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { hashFileBytes } from "../configurationIndex/hash"
import { childSegmentUid, childUid } from "../configurationIndex/logicalAddress"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleSnapshot } from "../configurationIndex/testData"
import type { ConfigurationContext } from "../context/types"
import { createSharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { createFullXmlSyncCompositionSnapshot } from "./sharedMetadata"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import type { FullXmlSyncAssignment } from "./types"
import {
  fullXmlSyncWorkerStateForTests,
  resetFullXmlSyncWorkerStateForTests,
  runFullXmlSyncWorkerCommand,
} from "./worker"

describe("full XML sync worker", () => {
  const tempDirs: string[] = []
  const context = {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  } as const
  const localMetadata = createSharedValidationSnapshot({ records: [], filePaths: [] })

  afterEach(() => {
    resetFullXmlSyncWorkerStateForTests()
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("prepares and writes every assignment without retaining its YAML or XML", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned])

    const result = await runFullXmlSyncWorkerCommand({
      kind: "execute",
      assignments: [assigned],
    })

    expect(result).toMatchObject({
      kind: "executionResult",
      diagnostics: [],
      warnings: [],
      writtenFiles: [{ targetXmlPath: "Catalogs/Товары.xml" }],
    })
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Товары.xml"))).toBe(true)
    expect(fullXmlSyncWorkerStateForTests()).toMatchObject({
      initialized: true,
      componentDir: projectDir,
      importProjectDir: projectDir,
    })
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("activeAssignmentId")
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("preparedIds")
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("baseIndexSnapshot")
  })

  it("keeps an already written XML and stops when the next YAML hash changed", async () => {
    const projectDir = createProject(["Первый", "Второй"])
    const assignments = [assignment(projectDir, "Первый"), assignment(projectDir, "Второй")]
    await initialize(projectDir, assignments)
    fs.writeFileSync(assignments[1]!.sourcePath, "Имя: Изменён\n")

    const result = await runFullXmlSyncWorkerCommand({
      kind: "execute",
      assignments,
    })

    expect(result?.kind).toBe("executionResult")
    if (result?.kind !== "executionResult") throw new Error("unexpected result")
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "full_xml_sync_source_changed",
        sourceProjectPath: assignments[1]!.sourceProjectPath,
      })
    )
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Первый.xml"))).toBe(true)
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Второй.xml"))).toBe(false)
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("activeAssignmentId")
  })

  it("releases all state on dispose", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    const baseSnapshot = snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))
    await initialize(projectDir, [assigned], context, baseSnapshot)

    expect(fullXmlSyncWorkerStateForTests().baseIndexSnapshot).toBe(baseSnapshot)

    await runFullXmlSyncWorkerCommand({ kind: "dispose" })

    expect(fullXmlSyncWorkerStateForTests()).toEqual({ initialized: false })
  })

  it("does not let caller context override the confirmed component profile", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned], {
      ...context,
      exportToXML: {
        version: context.version,
        itemsTree: [],
        componentKind: "configurationExtension",
        adoptedUuids: {
          [assigned.logicalAddress]: "11111111-1111-4111-8111-111111111111",
        },
        context: {
          forms: [],
          templates: [],
          parentName: "",
          metadataForNumbering: [],
        },
      },
    })

    const result = await runFullXmlSyncWorkerCommand({
      kind: "execute",
      assignments: [assigned],
    })

    expect(result).toMatchObject({ kind: "executionResult", diagnostics: [] })
    const xml = fs.readFileSync(join(projectDir, ".out", "Catalogs", "Товары.xml"), "utf8")
    expect(xml).not.toContain("<ObjectBelonging>Adopted</ObjectBelonging>")
    expect(xml).not.toContain("<ExtendedConfigurationObject>")
  })

  it("строит BaseForm заимствованной общей формы и не строит его собственной", async () => {
    for (const adopted of [true, false]) {
      resetFullXmlSyncWorkerStateForTests()
      const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-common-form-"))
      tempDirs.push(projectDir)
      const componentDir = join(projectDir, "cfe", "Расширение")
      const baseComponentDir = join(projectDir, "cf")
      const projectPath = "ОбщаяФорма/ФормаПродаж/Свойства.yaml"
      const sourcePath = join(componentDir, ...projectPath.split("/"))
      const baseSourcePath = join(baseComponentDir, ...projectPath.split("/"))
      fs.mkdirSync(join(sourcePath, ".."), { recursive: true })
      fs.mkdirSync(join(baseSourcePath, ".."), { recursive: true })
      fs.writeFileSync(
        sourcePath,
        ["Имя: ФормаПродаж", "Форма:", "  Ширина: 100", "  Элементы:", "    Поле:", "      Вид: ПолеВвода", ""].join(
          "\n"
        )
      )
      fs.writeFileSync(
        baseSourcePath,
        ["Имя: ФормаПродаж", "Форма:", "  Ширина: 80", "  Элементы:", "    Поле:", "      Вид: ПолеВвода", ""].join(
          "\n"
        )
      )
      const logicalAddress = "ОбщаяФорма.ФормаПродаж"
      const formAddress = logicalAddress
      const elementAddress = childUid(formAddress, "Элемент", "Поле")
      const baseIndex = sampleSnapshot()
      const baseSnapshot = snapshotConfigurationIndex(
        encodeConfigurationIndex({
          ...baseIndex,
          files: [
            ...baseIndex.files,
            {
              projectPath,
              contentHash: hashFileBytes(fs.readFileSync(baseSourcePath)),
            },
          ],
          entities: [
            ...baseIndex.entities,
            {
              logicalAddress: childUid(formAddress, "Элемент", "ФормаКоманднаяПанель"),
              sourceProjectPath: projectPath,
              identities: { xmlId: "9" },
            },
            {
              logicalAddress: elementAddress,
              sourceProjectPath: projectPath,
              identities: { xmlId: "10" },
            },
            {
              logicalAddress: childSegmentUid(elementAddress, "КонтекстноеМеню"),
              sourceProjectPath: projectPath,
              identities: { xmlId: "11" },
            },
            {
              logicalAddress: childSegmentUid(elementAddress, "РасширеннаяПодсказка"),
              sourceProjectPath: projectPath,
              identities: { xmlId: "12" },
            },
          ],
        })
      )
      const extensionIndex = sampleSnapshot()
      const assigned: FullXmlSyncAssignment = {
        id: projectPath,
        sourceProjectPath: projectPath,
        sourcePath,
        expectedContentHash: hashFileBytes(fs.readFileSync(sourcePath)),
        role: "properties",
        itemType: "MetadataCommonForm",
        itemName: "ФормаПродаж",
        logicalAddress,
        ...fullXmlSyncTestTopologyFields(projectPath),
      }
      await runFullXmlSyncWorkerCommand({
        kind: "initialize",
        workerIndex: 0,
        componentPath: "cfe/Продажи",
        componentDir,
        outputDir: join(projectDir, ".out"),
        context,
        profile: {
          kind: "configurationExtension",
          componentKind: "configurationExtension",
          adoptedUuids: adopted
            ? {
                [logicalAddress]: "11111111-1111-4111-8111-111111111111",
              }
            : {},
          baseForms: {
            componentDir: baseComponentDir,
            projectFiles: [
              {
                projectPath,
                contentHash: hashFileBytes(fs.readFileSync(baseSourcePath)),
              },
            ],
            snapshot: baseSnapshot,
          },
        },
        composition: createFullXmlSyncCompositionSnapshot([assigned]),
        targetIndex: snapshotConfigurationIndex(
          encodeConfigurationIndex({
            ...extensionIndex,
            componentPath: "cfe/Продажи",
            files: [
              ...extensionIndex.files,
              {
                projectPath,
                contentHash: hashFileBytes(fs.readFileSync(sourcePath)),
              },
            ],
            entities: [
              ...extensionIndex.entities,
              {
                logicalAddress: elementAddress,
                sourceProjectPath: projectPath,
                identities: { xmlId: "1000010" },
              },
            ],
          })
        ),
        localMetadata,
        baseMetadata: localMetadata,
      })
      expect(fullXmlSyncWorkerStateForTests().baseIndexSnapshot).toBe(baseSnapshot)

      const result = await runFullXmlSyncWorkerCommand({
        kind: "execute",
        assignments: [assigned],
      })

      expect(result).toMatchObject({
        kind: "executionResult",
        diagnostics: [],
      })
      const formXml = fs.readFileSync(join(projectDir, ".out", "CommonForms", "ФормаПродаж", "Ext", "Form.xml"), "utf8")
      if (adopted) {
        expect(formXml).toContain("<BaseForm")
        expect(formXml).toContain("<Width>80</Width>")
        const baseFormXml = formXml.slice(
          formXml.indexOf("<BaseForm"),
          formXml.indexOf("</BaseForm>") + "</BaseForm>".length
        )
        expect(baseFormXml).toContain('name="Поле" id="10"')
        expect(baseFormXml).not.toContain('id="1000010"')
      } else {
        expect(formXml).not.toContain("<BaseForm")
      }
    }
  })

  function createProject(names: readonly string[]): string {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-worker-"))
    tempDirs.push(projectDir)
    for (const name of names) {
      const dir = join(projectDir, "Справочник", name)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(join(dir, "Свойства.yaml"), `Имя: ${name}\n`)
    }
    return projectDir
  }

  async function initialize(
    projectDir: string,
    assignments: readonly FullXmlSyncAssignment[],
    workerContext: ConfigurationContext = context,
    baseSnapshot?: ReturnType<typeof snapshotConfigurationIndex>
  ): Promise<void> {
    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      componentPath: "cf",
      componentDir: projectDir,
      outputDir: join(projectDir, ".out"),
      context: workerContext,
      profile: {
        kind: baseSnapshot === undefined ? "configuration" : "configurationExtension",
        componentKind: baseSnapshot === undefined ? "configuration" : "configurationExtension",
        adoptedUuids: {},
        ...(baseSnapshot === undefined
          ? {}
          : {
              baseForms: {
                componentDir: projectDir,
                projectFiles: [],
                snapshot: baseSnapshot,
              },
            }),
      },
      composition: createFullXmlSyncCompositionSnapshot(assignments),
      targetIndex: snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot())),
      localMetadata,
      ...(baseSnapshot === undefined ? {} : { baseMetadata: localMetadata }),
    })
  }
})

function assignment(projectDir: string, name: string): FullXmlSyncAssignment {
  const sourcePath = join(projectDir, "Справочник", name, "Свойства.yaml")
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    sourceProjectPath: `Справочник/${name}/Свойства.yaml`,
    sourcePath,
    expectedContentHash: hashFileBytes(fs.readFileSync(sourcePath)),
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    ...fullXmlSyncTestTopologyFields(`Справочник/${name}/Свойства.yaml`),
  }
}
