import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { writeFullXmlSyncAssignment } from "./writeAssignment"
import type { FullXmlSyncAssignment } from "./types"

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

  it("writes Configuration.xml from prepared YAML and project composition", async () => {
    const projectDir = tempDir()
    const sourcePath = join(projectDir, "Конфигурация.yaml")
    fs.writeFileSync(sourcePath, "Имя: Конфигурация\n")
    const prepared = prepareYamlFiles({
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
    })
    fs.rmSync(sourcePath)
    const root = configurationAssignment(projectDir)

    const result = await writeFullXmlSyncAssignment({
      assignment: root,
      assignments: [root, catalogAssignment(projectDir, "Товары"), catalogAssignment(projectDir, "Контрагенты")],
      preparedYamlFile: prepared.yamlFiles[0]!,
      context: mockContextToXML(),
      outputDir: join(projectDir, "xml"),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
    })

    expect(result.diagnostics).toEqual([])
    expect(result.writtenFiles).toEqual([{ assignmentId: root.id, targetXmlPath: "Configuration.xml" }])
    const xml = fs.readFileSync(join(projectDir, "xml", "Configuration.xml"), "utf-8")
    expect(xml).toContain("<ChildObjects>")
    expect(xml).toContain("<Catalog>Контрагенты</Catalog>")
    expect(xml).toContain("<Catalog>Товары</Catalog>")
  })
})

function configurationAssignment(projectDir: string): FullXmlSyncAssignment {
  return {
    id: "Конфигурация.yaml",
    sourceProjectPath: "Конфигурация.yaml",
    sourcePath: join(projectDir, "Конфигурация.yaml"),
    role: "configuration",
    itemType: "MetadataConfiguration",
    itemName: "Конфигурация",
    logicalAddress: "Конфигурация",
    outputs: [{ routeKind: "owner", targetXmlPath: "Configuration.xml" }],
  }
}

function catalogAssignment(projectDir: string, name: string): FullXmlSyncAssignment {
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    sourceProjectPath: `Справочник/${name}/Свойства.yaml`,
    sourcePath: join(projectDir, "Справочник", name, "Свойства.yaml"),
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    outputs: [{ routeKind: "owner", targetXmlPath: `Catalogs/${name}.xml` }],
  }
}
