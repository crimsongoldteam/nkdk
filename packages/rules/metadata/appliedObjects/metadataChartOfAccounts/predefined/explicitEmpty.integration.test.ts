import { describe, expect, it } from "vitest"
import { XML_PRESENT_TAG_VALUE, markYAMLScalarTag, yamlScalarTagAt } from "@nkdk/runtime"
import {
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../../tests/directConversion"
import { ChartOfAccountsPredefinedItemRules } from "./rules"

describe("пустые виды субконто предопределённого счёта", () => {
  it("переносит явный пустой ExtDimensionTypes через !xml", () => {
    const imported = testMetadataItemFromXMLToYAML({
      rule: ChartOfAccountsPredefinedItemRules,
      xml: { _name: "Основной", ExtDimensionTypes: {} },
      name: "Основной",
    }).yaml as Record<string, unknown>

    expect(imported.ВидыСубконто).toBe(XML_PRESENT_TAG_VALUE)
    expect(yamlScalarTagAt(imported, "ВидыСубконто")).toBe("xml/present")

    const yaml = { ВидыСубконто: XML_PRESENT_TAG_VALUE }
    markYAMLScalarTag(yaml, "ВидыСубконто", "xml/present")
    expect(testMetadataItemFromYAMLToXML({
      rule: ChartOfAccountsPredefinedItemRules,
      yaml,
      name: "Основной",
    }).xml.ExtDimensionTypes).toEqual({})
  })
})
