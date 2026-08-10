import { describe, expect, it } from "vitest"
import { MetadataItemRule, PropertyRule } from "../../../ruleRuntime"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import { serializeDirectXML, testPropertyFromYAMLToXML } from "../../../../tests/directConversion"
import {
  fullConditionalAppearanceItems,
  minimalConditionalAppearanceItems,
  fullConditionalAppearanceItemsYAML,
  minimalConditionalAppearanceItemsYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearanceItems",
}

describe("export ConditionalAppearanceItems to XML", () => {
  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: fullConditionalAppearanceItems,
      yaml: fullConditionalAppearanceItemsYAML,
      xmlRootTag: "ConditionalAppearance",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports minimal.xml", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: minimalConditionalAppearanceItems,
      yaml: minimalConditionalAppearanceItemsYAML,
      xmlRootTag: "ConditionalAppearance",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
    expect(result).toContain("<dcsset:filter/>")
  })

  it("восстанавливает обязательный пустой отбор при отсутствии поля в непустом YAML-элементе", () => {
    const metadataRule = {
      itemType: "ConditionalAppearanceProbe",
      properties: {
        value: {
          type: "ConditionalAppearanceItems",
          yaml: "Значение",
          xml: "ConditionalAppearance",
        },
      },
    } as const satisfies MetadataItemRule
    const restored = testPropertyFromYAMLToXML({
      rule: metadataRule,
      yaml: {
        Значение: [
          {
            Поля: ["ТипОбъектаПоиска"],
            Оформление: {},
          },
        ],
      },
    })

    expect(serializeDirectXML(restored.xml)).toContain("<dcsset:filter/>")
  })
})
