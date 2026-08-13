import { describe, expect, it } from "vitest"
import { EMPTY_XML_TAG_VALUE, markYAMLScalarTag, yamlScalarTagAt } from "@nkdk/runtime"
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

    expect(imported.ВидыСубконто).toBe(EMPTY_XML_TAG_VALUE)
    expect(yamlScalarTagAt(imported, "ВидыСубконто")).toBe("xml")

    const yaml = { ВидыСубконто: EMPTY_XML_TAG_VALUE }
    markYAMLScalarTag(yaml, "ВидыСубконто", "xml")
    expect(testMetadataItemFromYAMLToXML({
      rule: ChartOfAccountsPredefinedItemRules,
      yaml,
      name: "Основной",
    }).xml.ExtDimensionTypes).toEqual({})
  })
})
