import { describe, expect, it } from "vitest"
import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import "./register"

const itemsTree = [
  { itemType: "MetadataExternalDataSource" as const, name: "ВнешнийИсточникДанныхВсеСвойства", path: "" },
  { itemType: "MetadataExternalDataSourceCube" as const, name: "КубВсеСвойства", path: "" },
]
const metadataTargetOwners = [
  { itemType: "MetadataExternalDataSourceCube" as const, name: "КубВсеСвойства", owner: { root: "ExternalDataSource" as const, objectName: "ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства" } },
]

describe("MetadataExternalDataSourceDimensionTable YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("should export %s", (fixture) => {
    const result = convert(fixture)
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const convert = (fixture: string) => testPropertyFixtureThroughYAML({ propertyType: "MetadataExternalDataSourceDimensionTable", xmlRootTag: "MetaDataObject", importMetaUrl: import.meta.url, fixture, itemsTree, metadataTargetOwners })
const normalize = (value: string) => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
