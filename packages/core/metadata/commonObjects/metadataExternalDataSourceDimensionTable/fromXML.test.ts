import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import "./register"

const rule = { type: "MetadataExternalDataSourceDimensionTable" } as const
const itemsTree = [
  { itemType: "MetadataExternalDataSource" as const, name: "ВнешнийИсточникДанныхВсеСвойства", path: "" },
  { itemType: "MetadataExternalDataSourceCube" as const, name: "КубВсеСвойства", path: "" },
]
const normalizeXML = (value: string) => value.replace(/^\uFEFF?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n")

describe("MetadataExternalDataSourceDimensionTable XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (path) => {
    const data = testImportPropertyFromXML({
      rule,
      path,
      xmlRootTag: "MetaDataObject",
      importMetaUrl: import.meta.url,
    })

    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: data,
      xmlRootTag: "MetaDataObject",
      exportXmlDataAsRoot: true,
      itemsTree,
      path,
      importMetaUrl: import.meta.url,
    })

    expect(normalizeXML(result)).toEqual(normalizeXML(expectedResult))
  })
})
