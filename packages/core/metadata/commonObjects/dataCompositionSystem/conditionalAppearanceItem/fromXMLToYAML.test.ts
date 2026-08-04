import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import {
  fullConditionalAppearanceItems,
  fullConditionalAppearanceItemsYAML,
  minimalConditionalAppearanceItems,
  minimalConditionalAppearanceItemsYAML,
} from "./__fixtures__/data"
import "./types"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import type { MetadataItemRule } from "../../../orchestration"

const rule: PropertyRule = {
  type: "ConditionalAppearanceItems",
  yaml: "УсловноеОформлениеКомпоновкиДанных",
}

describe("export ConditionalAppearanceItems to YAML", () => {
  it("exports full collection", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: fullConditionalAppearanceItems,
      yaml: fullConditionalAppearanceItemsYAML,
    })

    expect(result).toEqual({ УсловноеОформлениеКомпоновкиДанных: fullConditionalAppearanceItemsYAML })
  })

  it("exports minimal collection", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: minimalConditionalAppearanceItems,
      yaml: minimalConditionalAppearanceItemsYAML,
      xmlRootTag: "ConditionalAppearance",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({ УсловноеОформлениеКомпоновкиДанных: minimalConditionalAppearanceItemsYAML })
  })

  it("восстанавливает явно пустые части элемента без reference XML", () => {
    const metadataRule = {
      itemType: "ConditionalAppearanceProbe",
      properties: {
        value: {
          type: "ConditionalAppearanceItems",
          yaml: "Значение",
          xml: "ConditionalAppearance",
          configurationIndexAddressing: "yamlPath",
        },
      },
    } as const satisfies MetadataItemRule
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Test.ConditionalAppearance" })
    const imported = testPropertyFromXMLToYAML({
      rule: metadataRule,
      context: contexts.importContext,
      xml: {
        ConditionalAppearance: {
          "dcsset:item": {
            "dcsset:selection": {},
            "dcsset:filter": {},
            "dcsset:appearance": {},
          },
        },
      },
    })
    const restored = testPropertyFromYAMLToXML({
      rule: metadataRule,
      yaml: imported.yaml,
      context: contexts.exportContext(),
    })

    expect(restored.xml).toMatchObject({
      ConditionalAppearance: {
        "dcsset:item": [
          {
            "dcsset:selection": {},
            "dcsset:filter": {},
            "dcsset:appearance": {},
          },
        ],
      },
    })
  })
})
