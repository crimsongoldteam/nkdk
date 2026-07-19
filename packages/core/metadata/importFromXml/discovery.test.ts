import { join } from "path"
import { describe, expect, it, vi } from "vitest"
import { discoverXmlImport } from "./discovery"
import type { XmlImportRoute } from "./types"

const xmlDir = "/xml-dump"
const source = { kind: "itemRule", itemType: "test" } as const

const testRoutes = [
  {
    kind: "assignment",
    xmlPattern: "Configuration.xml",
    targetPattern: "Конфигурация.yaml",
    role: "configuration",
    itemType: "MetadataConfiguration",
    source,
  },
  {
    kind: "assignment",
    xmlPattern: "Catalogs/{ownerName}.xml",
    targetPattern: "Справочник/{ownerName}/Свойства.yaml",
    role: "properties",
    itemType: "MetadataCatalog",
    source,
  },
  {
    kind: "assignment",
    xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}.xml",
    targetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
    role: "fileItem",
    itemType: "ClientApplicationForm",
    source,
  },
  {
    kind: "externalFile",
    xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}/Ext/Form/Module.bsl",
    targetPattern: "Справочник/{ownerName}/Формы/{itemName}/Модуль.bsl",
    assignmentTargetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
    source,
  },
] as const satisfies readonly XmlImportRoute[]

function fakeFs(paths: readonly string[]) {
  return {
    listFiles: async () => paths,
    readFile: vi.fn(),
  }
}

describe("XML import discovery", () => {
  it("builds one assignment per YAML and never reads XML contents", async () => {
    const fixturePaths = [
      "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
      "Catalogs/Контрагенты/Forms/ФормаЭлемента.xml",
      "Catalogs/Контрагенты.xml",
      "Configuration.xml",
    ]
    const fs = fakeFs(fixturePaths)

    const result = await discoverXmlImport({ xmlDir, routes: testRoutes, fs })

    expect(fs.readFile).not.toHaveBeenCalled()
    expect(result.assignments.map((assignment) => assignment.targetProjectPath)).toEqual([
      "Конфигурация.yaml",
      "Справочник/Контрагенты/Свойства.yaml",
      "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    ])
    expect(result.assignments.at(-1)?.externalFiles).toEqual([
      {
        sourcePath: join(xmlDir, fixturePaths[0]),
        targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Модуль.bsl",
      },
    ])
    expect(result.assignments.at(-1)?.xmlFiles).toEqual([expect.objectContaining({ role: "metadata" })])
    expect(result.assignments.at(-1)?.owner).toMatchObject({
      itemType: "MetadataCatalog",
      name: "Контрагенты",
      logicalAddress: "Справочник.Контрагенты",
    })
  })

  it("groups several XML inputs into the same assignment", async () => {
    const routes = [
      testRoutes[1],
      {
        ...testRoutes[1],
        xmlPattern: "Catalogs/{ownerName}/Ext/Predefined.xml",
        source: { kind: "property", propertyName: "predefined", propertyType: "Predefined" } as const,
      },
    ] satisfies readonly XmlImportRoute[]

    const result = await discoverXmlImport({
      xmlDir,
      routes,
      fs: fakeFs(["Catalogs/Контрагенты.xml", "Catalogs/Контрагенты/Ext/Predefined.xml"]),
    })

    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0].xmlFiles).toEqual([
      expect.objectContaining({ role: "metadata" }),
      expect.objectContaining({ role: "property" }),
    ])
  })

  it("fails before workers and reports every unknown file", async () => {
    const fs = fakeFs(["z.bin", "Unknown.bin"])

    await expect(discoverXmlImport({ xmlDir, routes: testRoutes, fs })).rejects.toMatchObject({
      code: "unknown_xml_dump_file",
      paths: ["Unknown.bin", "z.bin"],
    })
    expect(fs.readFile).not.toHaveBeenCalled()
  })

  it("rejects incompatible matches for one source path", async () => {
    const conflictingRoutes = [
      testRoutes[1],
      { ...testRoutes[1], targetPattern: "Другой/{ownerName}/Свойства.yaml" },
    ] satisfies readonly XmlImportRoute[]

    await expect(
      discoverXmlImport({
        xmlDir,
        routes: conflictingRoutes,
        fs: fakeFs(["Catalogs/Контрагенты.xml"]),
      })
    ).rejects.toMatchObject({ code: "xml_import_route_conflict", paths: ["Catalogs/Контрагенты.xml"] })
  })

  it("rejects an external file whose assignment is absent", async () => {
    await expect(
      discoverXmlImport({
        xmlDir,
        routes: [testRoutes[3]],
        fs: fakeFs(["Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form/Module.bsl"]),
      })
    ).rejects.toMatchObject({ code: "xml_import_assignment_missing" })
  })
})
