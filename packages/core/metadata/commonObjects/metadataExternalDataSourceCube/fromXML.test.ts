import { describe, expect, it } from "vitest"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import { mockContextFromXML } from "../../../tests/mockContext"
import { testExportPropertyToXML } from "../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { importContentFromXML } from "../../../xml/import/importer"
import { MetadataExternalDataSourceCubeRules } from "./rules"
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

describe("MetadataExternalDataSourceCube XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (path) => {
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

  it("imports dimension table child names into dimensionTables without dimensionTableNames", () => {
    const data = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "MetaDataObject",
      importMetaUrl: import.meta.url,
    }) as Record<string, unknown>

    expect(data).not.toHaveProperty("dimensionTableNames")
  })

  it("does not define legacy dimensionTableNames pseudo-form rule", () => {
    expect(MetadataExternalDataSourceCubeRules.properties).not.toHaveProperty("dimensionTableNames")
  })
})
