import { describe, expect, it } from "vitest"

import { mockContextToXML } from "../../../tests/mockContext"
import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testMetadataItemFromYAMLToXML,
  testPropertyFixtureThroughYAML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../ruleRuntime/property/types"
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

  it("восстанавливает пустые характеристики без reference XML", () => {
    const rule = {
      itemType: "ExternalDataSourceCubeCharacteristicsProbe",
      properties: { value: MetadataExternalDataSourceCubeRules.properties.characteristics },
    } as const satisfies MetadataItemRule
    const roundTrip = createDirectRoundTripContexts()
    const imported = testPropertyFromXMLToYAML({
      rule,
      xml: { Properties: { Characteristics: {} } },
      context: roundTrip.importContext,
    })
    const restored = testPropertyFromYAMLToXML({
      rule,
      yaml: imported.yaml,
      context: roundTrip.exportContext(),
    })

    expect(serializeDirectXML(restored.xml)).toContain("<Characteristics/>")
  })
})

const normalizeXML = (value: string): string =>
  value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
