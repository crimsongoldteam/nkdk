import { describe, expect, it } from "vitest"
import {
  testAppliedObjectFromXMLToYAML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../ruleRuntime"
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

  it("keeps non-default lengths explicit and exports catalog defaults when omitted", () => {
    const rule = {
      itemType: "MetadataCatalogLengthProbe",
      properties: {
        codeLength: MetadataCatalogRules.properties.codeLength,
        descriptionLength: MetadataCatalogRules.properties.descriptionLength,
      },
    } satisfies MetadataItemRule

    const imported = testPropertyFromXMLToYAML({
      rule,
      xml: { Properties: { CodeLength: 10, DescriptionLength: 30 } },
    })

    expect(imported.yaml).toEqual({ ДлинаКода: 10, ДлинаНаименования: 30 })

    const exportedExplicit = testPropertyFromYAMLToXML({
      rule,
      yaml: imported.yaml,
    })
    expect(exportedExplicit.xml).toEqual({
      Properties: { CodeLength: 10, DescriptionLength: 30 },
    })

    const exportedDefaults = testPropertyFromYAMLToXML({ rule, yaml: {} })
    expect(exportedDefaults.xml).toEqual({
      Properties: { CodeLength: 9, DescriptionLength: 25 },
    })
  })
})
