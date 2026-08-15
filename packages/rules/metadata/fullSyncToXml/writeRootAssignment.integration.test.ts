import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { childUid } from "@nkdk/runtime"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { writeFullXmlSyncAssignment } from "./writeAssignment"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"
import type { FullXmlSyncAssignment } from "./types"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import {
  createFullXmlSyncCompositionReader,
  createFullXmlSyncCompositionSnapshot,
} from "./sharedMetadata"
import { testConfigurationIndexReader } from "../../tests/configurationIndex"

describe("writeFullXmlSyncAssignment for root Configuration", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-write-root-assignment-"))
    tempDirs.push(dir)
    return dir
  }

  function prepareConfigurationYaml(projectDir: string, yaml: string) {
    const sourcePath = join(projectDir, "Конфигурация.yaml")
    fs.writeFileSync(sourcePath, yaml)
    return prepareYamlFiles({
      files: [
        {
          projectPath: "Конфигурация.yaml",
          filePath: sourcePath,
          role: "configuration",
          owner: { dir: "", name: "Конфигурация" },
          itemType: "MetadataConfiguration",
        },
      ],
      itemTypeByYamlDir: {},
    }).yamlFiles[0]!
  }

  async function writeRoot(
    projectDir: string,
    preparedYamlFile: ReturnType<typeof prepareConfigurationYaml>,
    assignments: readonly FullXmlSyncAssignment[],
    index = testConfigurationIndexReader()
  ) {
    const context = mockContextToXML()
    const prepared = prepareFullXmlSyncAssignment({
      assignment: assignments[0]!,
      composition: createFullXmlSyncCompositionReader(createFullXmlSyncCompositionSnapshot(assignments)),
      preparedYamlFile,
      context,
      index,
    })
    return writeFullXmlSyncAssignment({
      prepared,
      context,
      outputTarget: { kind: "directory", outputDir: join(projectDir, "xml") },
    })
  }

  it("writes Configuration.xml from prepared YAML and project composition", async () => {
    const projectDir = tempDir()
    const sourcePath = join(projectDir, "Конфигурация.yaml")
    const prepared = prepareConfigurationYaml(projectDir, "Имя: Конфигурация\n")
    fs.rmSync(sourcePath)
    const root = configurationAssignment(projectDir)
    const assignments = [
      root,
      catalogAssignment(projectDir, "Товары"),
      catalogAssignment(projectDir, "Контрагенты"),
      flatSessionParameterAssignment(projectDir, "ТекущийПользователь"),
    ]

    const result = await writeRoot(projectDir, prepared, assignments)

    expect(result.diagnostics).toEqual([])
    expect(result.writtenFiles).toEqual([{ assignmentId: root.id, targetXmlPath: "Configuration.xml" }])
    const xml = fs.readFileSync(join(projectDir, "xml", "Configuration.xml"), "utf-8")
    expect(xml).toContain("<ChildObjects>")
    expect(xml).toContain("<Catalog>Контрагенты</Catalog>")
    expect(xml).toContain("<Catalog>Товары</Catalog>")
    expect(xml).toContain("<SessionParameter>ТекущийПользователь</SessionParameter>")
    expect(xml).not.toContain("ТекущийПользователь.yaml")
    expect(result.profile?.rulesPassCount).toBe(1)
    expect(new Set(result.profile?.propertyPaths).size).toBe(result.profile?.propertyPaths.length)
  })

  it("materializes an empty ClientApplicationInterface from !xml/present", async () => {
    const projectDir = tempDir()
    const prepared = prepareConfigurationYaml(
      projectDir,
      "Имя: Конфигурация\nИнтерфейсКлиентскогоПриложения: !xml/present\n"
    )
    const root = configurationAssignment(projectDir)
    const result = await writeRoot(projectDir, prepared, [root])

    expect(result.diagnostics).toEqual([])
    const xml = fs.readFileSync(join(projectDir, "xml", "Ext", "ClientApplicationInterface.xml"), "utf-8")
    expect(xml.match(/<panelDef id=/gu)).toHaveLength(5)
  })

  it("restores ChildObjects order from the configuration index", async () => {
    const projectDir = tempDir()
    const sourcePath = join(projectDir, "Конфигурация.yaml")
    const prepared = prepareConfigurationYaml(projectDir, "Имя: Конфигурация\n")
    fs.rmSync(sourcePath)
    const root = configurationAssignment(projectDir)
    const assignments = [
      root,
      catalogAssignment(projectDir, "Контрагенты"),
      catalogAssignment(projectDir, "Товары"),
    ]
    const index = testConfigurationIndexReader([
        {
          logicalAddress: childUid("Конфигурация", "Свойство", "childObjects"),
          children: [
              { xmlName: "Catalog", name: "Товары" },
              { xmlName: "Catalog", name: "Контрагенты" },
            ],
        },
      ])

    await writeRoot(projectDir, prepared, assignments, index)

    const xml = fs.readFileSync(join(projectDir, "xml", "Configuration.xml"), "utf-8")
    expect(xml.indexOf("<Catalog>Товары</Catalog>")).toBeLessThan(
      xml.indexOf("<Catalog>Контрагенты</Catalog>")
    )
  })
})

function configurationAssignment(projectDir: string): FullXmlSyncAssignment {
  return {
    id: "Конфигурация.yaml",
    sourceProjectPath: "Конфигурация.yaml",
    sourcePath: join(projectDir, "Конфигурация.yaml"),
    expectedContentHash: 0n,
    role: "configuration",
    itemType: "MetadataConfiguration",
    itemName: "Конфигурация",
    logicalAddress: "Конфигурация",
    ...fullXmlSyncTestTopologyFields("Конфигурация.yaml"),
  }
}

function catalogAssignment(projectDir: string, name: string): FullXmlSyncAssignment {
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    sourceProjectPath: `Справочник/${name}/Свойства.yaml`,
    sourcePath: join(projectDir, "Справочник", name, "Свойства.yaml"),
    expectedContentHash: 0n,
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    ...fullXmlSyncTestTopologyFields(`Справочник/${name}/Свойства.yaml`),
  }
}

function flatSessionParameterAssignment(projectDir: string, name: string): FullXmlSyncAssignment {
  return {
    id: `ПараметрСеанса/${name}.yaml`,
    sourceProjectPath: `ПараметрСеанса/${name}.yaml`,
    sourcePath: join(projectDir, "ПараметрСеанса", `${name}.yaml`),
    expectedContentHash: 0n,
    role: "properties",
    itemType: "MetadataSessionParameter",
    itemName: name,
    logicalAddress: `ПараметрСеанса.${name}`,
    ...fullXmlSyncTestTopologyFields(`ПараметрСеанса/${name}.yaml`),
  }
}
