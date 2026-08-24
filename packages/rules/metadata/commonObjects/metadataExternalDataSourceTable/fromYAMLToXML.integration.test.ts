import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testPropertyFixtureThroughYAML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { MetadataExternalDataSourceTableRules } from "./rules"
import "./register"

const itemsTree = [
  { itemType: "MetadataExternalDataSource" as const, name: "ВнешнийИсточникДанныхВсеСвойства", path: "" },
]
const metadataTargetOwners = [
  { itemType: "MetadataExternalDataSource" as const, name: "ВнешнийИсточникДанныхВсеСвойства", owner: { root: "ExternalDataSource" as const, objectName: "ВнешнийИсточникДанныхВсеСвойства" } },
]

describe("MetadataExternalDataSourceTable YAML → XML", () => {
  it.each(["minimal.xml"])("should export %s", (fixture) => {
    const result = convert(fixture)
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("восстанавливает UUID вложенной команды без reference XML", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataExternalDataSourceTable",
      xmlRootTag: "MetaDataObject",
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      itemsTree,
      metadataTargetOwners,
      withReference: false,
    })

    expect(result.result).toContain('<Command uuid="1671b912-76b3-466c-b319-fa1e7c54f0f9">')
  })

  it("восстанавливает пустые характеристики без reference XML", () => {
    const rule = {
      itemType: "ExternalDataSourceTableCharacteristicsProbe",
      properties: { value: MetadataExternalDataSourceTableRules.properties.characteristics },
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

  it("строит канонический UnfilledParentValue без reference XML и снимка", () => {
    const rule = {
      itemType: "ExternalDataSourceTableUnfilledParentProbe",
      properties: { value: MetadataExternalDataSourceTableRules.properties.unfilledParentValue },
    } as const satisfies MetadataItemRule

    const restored = testPropertyFromYAMLToXML({ rule, yaml: {} })

    expect(serializeDirectXML(restored.xml)).toContain('<UnfilledParentValue xsi:nil="true"/>')
  })
})

const convert = (fixture: string) => testPropertyFixtureThroughYAML({ propertyType: "MetadataExternalDataSourceTable", xmlRootTag: "MetaDataObject", importMetaUrl: import.meta.url, fixture, itemsTree, metadataTargetOwners })
const normalize = (value: string) => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
