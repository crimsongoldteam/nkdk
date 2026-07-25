import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"
import type { FullXmlSyncAssignment } from "./types"

describe("prepareFullXmlSyncAssignment", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it("prepares owner XML without writing files", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-assignment-"))
    tempDirs.push(projectDir)
    const sourceProjectPath = "Обработка/ОбработкаВсеСвойства/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства"), { recursive: true })
    fs.writeFileSync(sourcePath, "Синоним: Синоним\nКомментарий: Комментарий\n")
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Обработка", name: "ОбработкаВсеСвойства" },
          itemType: "MetadataDataProcessor",
        },
      ],
      itemTypeByYamlDir: { Обработка: "MetadataDataProcessor" },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      role: "properties",
      itemType: "MetadataDataProcessor",
      itemName: "ОбработкаВсеСвойства",
      logicalAddress: "Обработка.ОбработкаВсеСвойства",
      owner: undefined,
      outputs: [{ routeKind: "owner", targetXmlPath: "DataProcessors/ОбработкаВсеСвойства.xml" }],
    }
    const writeFile = vi.spyOn(fs.promises, "writeFile")

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      assignments: [],
    })

    expect(prepared.documents.map((document) => document.targetXmlPath)).toEqual([
      "DataProcessors/ОбработкаВсеСвойства.xml",
    ])
    expect(prepared.documents[0]?.xml).toHaveProperty("MetaDataObject")
    expect(prepared.profile.rulesPassCount).toBe(1)
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("provides the applied object owner to nested metadata targets", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-assignment-owner-"))
    tempDirs.push(projectDir)
    const sourceProjectPath = "Справочник/Товары/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(
      sourcePath,
      [
        "Реквизиты:",
        "  ИспользоватьХранилище:",
        "    Тип: Булево",
        "    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: ИспользоватьХранилище",
        "",
      ].join("\n")
    )
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          itemType: "MetadataCatalog",
        },
      ],
      itemTypeByYamlDir: { Справочник: "MetadataCatalog" },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      role: "properties",
      itemType: "MetadataCatalog",
      itemName: "Товары",
      logicalAddress: "Справочник.Товары",
      owner: undefined,
      outputs: [{ routeKind: "owner", targetXmlPath: "Catalogs/Товары.xml" }],
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      assignments: [],
    })

    expect(prepared.documents[0]?.xml).toMatchObject({
      MetaDataObject: {
        Catalog: {
          ChildObjects: {
            Attribute: [
              {
                Properties: {
                  BinaryDataStorageLocationUseField:
                    "Catalog.Товары.Attribute.ИспользоватьХранилище",
                },
              },
            ],
          },
        },
      },
    })
  })
})
