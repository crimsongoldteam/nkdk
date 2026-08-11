import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  testAppliedObjectFromXMLToYAML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { MetadataChartOfAccountsRules } from "./rules"

describe("MetadataChartOfAccounts XML → YAML", () => {
  it("выводит стандартные табличные части в YAML", () => {
    const imported = testAppliedObjectFromXMLToYAML({
      rule: MetadataChartOfAccountsRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(imported.yaml).toHaveProperty("СтандартныеТабличныеЧасти.ExtDimensionTypes")
  })

  it("не добавляет язык по умолчанию к синониму с пустым кодом языка", () => {
    const rule = {
      itemType: "StandardTabularSectionsProbe",
      properties: {
        standardTabularSections: MetadataChartOfAccountsRules.properties.standardTabularSections,
      },
    } as const
    const synonym = {
      "v8:item": [{ "v8:lang": "", "v8:content": "Виды субконто" }],
    }
    const xml = {
      Properties: {
        StandardTabularSections: {
          "xr:StandardTabularSection": {
            _name: "ExtDimensionTypes",
            "xr:Synonym": synonym,
          },
        },
      },
    }
    const contexts = createDirectRoundTripContexts()

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml,
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(
      (
        exported.xml.Properties as {
          StandardTabularSections: {
            "xr:StandardTabularSection": Array<{ "xr:Synonym": unknown }>
          }
        }
      ).StandardTabularSections["xr:StandardTabularSection"][0]?.["xr:Synonym"]
    ).toEqual(synonym)
  })
})
