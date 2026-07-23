import { describe, expect, it } from "vitest"
import { testAppliedObjectFromXMLToYAML, testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"

describe("MetadataCatalog XML → YAML", () => {
  it.each([
    ["full.xml", fullYAML],
    ["minimal.xml", minimalYAML],
  ] as const)("exports %s directly to YAML", (fixture, expected) => {
    const result = testAppliedObjectFromXMLToYAML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    expect(result.yaml).toEqual(expected)
  })

  it.each([
    ["ChartOfCharacteristicTypes.ВопросыДляАнкетирования", "ПланВидовХарактеристик.ВопросыДляАнкетирования"],
    ["ExchangePlan.ИнтеграцияСМагазинамиСоцСетей", "ПланОбмена.ИнтеграцияСМагазинамиСоцСетей"],
  ])("exports owner %s to canonical YAML", (xmlReference, yamlReference) => {
    const result = testPropertyFromXMLToYAML({
      rule: {
        itemType: "CatalogOwnersProbe",
        properties: {
          owners: MetadataCatalogRules.properties.owners,
        },
      },
      xml: {
        Properties: {
          Owners: {
            "xr:Item": {
              "_xsi:type": "xr:MDObjectRef",
              "#text": xmlReference,
            },
          },
        },
      },
    })

    expect(result.yaml).toEqual({ Владельцы: [yamlReference] })
  })
})
