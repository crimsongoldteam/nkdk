import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { MetadataExternalDataSourceCubeRules } from "./rules"

import "./register"

const itemsTree = [
  { itemType: "MetadataExternalDataSource" as const, name: "ВнешнийИсточникДанныхВсеСвойства", path: "" },
]
const metadataTargetOwners = [
  {
    itemType: "MetadataExternalDataSource" as const,
    name: "ВнешнийИсточникДанныхВсеСвойства",
    owner: { root: "ExternalDataSource" as const, objectName: "ВнешнийИсточникДанныхВсеСвойства" },
  },
]

describe("MetadataExternalDataSourceCube XML → YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (fixture) => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataExternalDataSourceCube",
      xmlRootTag: "MetaDataObject",
      importMetaUrl: import.meta.url,
      fixture,
      itemsTree,
      metadataTargetOwners,
    })

    expect(normalizeXML(result.result)).toBe(normalizeXML(result.expected))
  })

  it("imports dimension table child names into dimensionTables without dimensionTableNames", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataExternalDataSourceCube",
      xmlRootTag: "MetaDataObject",
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      itemsTree,
      metadataTargetOwners,
    })

    expect(result.yaml).not.toHaveProperty("Значение.dimensionTableNames")
    expect(result.result).toContain("<DimensionTable>ТаблицаИзмеренияВсеСвойства</DimensionTable>")
    expect(result.result).toContain("<DimensionTable>ТаблицаИзмеренияПоУмолчанию</DimensionTable>")
  })

  it("does not define legacy dimensionTableNames pseudo-form rule", () => {
    expect(MetadataExternalDataSourceCubeRules.properties).not.toHaveProperty("dimensionTableNames")
  })
})

const normalizeXML = (value: string): string =>
  value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
