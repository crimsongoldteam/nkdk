import { describe, expect, it } from "vitest"
import type { XmlImportRoute } from "./types"
import { compileXmlImportRouteStructure, matchXmlImportRouteStructure } from "./routeStructure"

const source = { kind: "itemRule", itemType: "test" } as const

describe("XML import route structure", () => {
  it("matches only routes reachable through the XML path structure", () => {
    const routes = [
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
        xmlPattern: "Documents/{ownerName}.xml",
        targetPattern: "Документ/{ownerName}/Свойства.yaml",
        role: "properties",
        itemType: "MetadataDocument",
        source,
      },
      {
        kind: "externalFile",
        xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}/Ext/{relativePath...}",
        targetPattern: "Справочник/{ownerName}/Формы/{itemName}/{relativePath...}",
        assignmentTargetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
        source,
      },
    ] satisfies readonly XmlImportRoute[]

    const structure = compileXmlImportRouteStructure(routes)

    expect(matchXmlImportRouteStructure(structure, "Catalogs/Контрагенты.xml")).toEqual([
      expect.objectContaining({
        kind: "assignment",
        targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
        values: { ownerName: "Контрагенты" },
      }),
    ])
    expect(matchXmlImportRouteStructure(structure, "Catalogs/Контрагенты/Forms/Форма/Ext/Form/Module.bsl")).toEqual([
      expect.objectContaining({
        kind: "externalFile",
        targetProjectPath: "Справочник/Контрагенты/Формы/Форма/Form/Module.bsl",
        assignmentTargetProjectPath: "Справочник/Контрагенты/Формы/Форма/Форма.yaml",
        values: { ownerName: "Контрагенты", itemName: "Форма", relativePath: "Form/Module.bsl" },
      }),
    ])
    expect(matchXmlImportRouteStructure(structure, "Reports/Продажи.xml")).toEqual([])
  })
})
