import { describe, expect, it } from "vitest"

import { mockContextToXML } from "../../../tests/mockContext"
import { testMetadataItemFromYAMLToXML, testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
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

describe("MetadataExternalDataSourceCube YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("should export %s", (fixture) => {
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

  it("exports DimensionTable child names from dimensionTables", () => {
    const imported = testPropertyFixtureThroughYAML({
      propertyType: "MetadataExternalDataSourceCube",
      xmlRootTag: "MetaDataObject",
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
      itemsTree,
      metadataTargetOwners,
    })
    const context = mockContextToXML()
    context.exportToXML.itemsTree.push(...itemsTree)
    context.importFromYAML = { metadataTargetOwners }
    const result = testMetadataItemFromYAMLToXML({
      context,
      rule: MetadataExternalDataSourceCubeRules,
      name: "КубПоУмолчанию",
      yaml: (imported.yaml as Record<string, unknown>).Значение,
      propertyValues: new Map([
        ["dimensionTables", ["ТаблицаИзмеренияВсеСвойства", "ТаблицаИзмеренияПоУмолчанию"]],
      ]),
    })
    const xml = JSON.stringify(result.xml)

    expect(xml).toContain("ТаблицаИзмеренияВсеСвойства")
    expect(xml).toContain("ТаблицаИзмеренияПоУмолчанию")
  })
})

const normalizeXML = (value: string): string =>
  value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
