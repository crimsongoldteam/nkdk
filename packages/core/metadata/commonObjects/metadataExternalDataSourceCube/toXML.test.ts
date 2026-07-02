import { describe, expect, it } from "vitest"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import { mockContextFromXML } from "../../../tests/mockContext"
import { testExportPropertyToXML } from "../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { importContentFromXML } from "../../../xml/import/importer"
import "./register"

const rule = { type: "MetadataExternalDataSourceCube" } as const
const itemsTree = [
  { itemType: "MetadataExternalDataSource" as const, name: "ВнешнийИсточникДанныхВсеСвойства", path: "" },
]
const normalizeXML = (value: string) => value.replace(/^\uFEFF?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n")
const fullDimensionTableNames = ["ТаблицаИзмеренияВсеСвойства", "ТаблицаИзмеренияПоУмолчанию"]
const importReferenceMetadata = (path: string): unknown => {
  const xmlString = readXMLFixtureAsString(import.meta.url, path)
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlString)
  return importPropertyFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule,
    value: parsed.MetaDataObject,
  })
}

describe("export MetadataExternalDataSourceCube to XML", () => {
  it.each(["full.xml", "minimal.xml"])("should export %s", (path) => {
    const data = testImportPropertyFromXML({
      rule,
      path,
      xmlRootTag: "MetaDataObject",
      importMetaUrl: import.meta.url,
    }) as Record<string, unknown>
    if (path === "full.xml") data.dimensionTables = fullDimensionTableNames

    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: data,
      xmlRootTag: "MetaDataObject",
      exportXmlDataAsRoot: true,
      itemsTree,
      path,
      importMetaUrl: import.meta.url,
      referenceMetadata: importReferenceMetadata(path),
    })

    expect(normalizeXML(result)).toEqual(normalizeXML(expectedResult))
  })

  it("exports DimensionTable child names from dimensionTables", () => {
    const data = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "MetaDataObject",
      importMetaUrl: import.meta.url,
    }) as Record<string, unknown>
    data.dimensionTables = fullDimensionTableNames

    const { result } = testExportPropertyToXML({
      rule,
      value: data,
      xmlRootTag: "MetaDataObject",
      exportXmlDataAsRoot: true,
      itemsTree,
      referenceMetadata: undefined,
    })

    expect(result).toContain("<DimensionTable>ТаблицаИзмеренияВсеСвойства</DimensionTable>")
    expect(result).toContain("<DimensionTable>ТаблицаИзмеренияПоУмолчанию</DimensionTable>")
  })
})
