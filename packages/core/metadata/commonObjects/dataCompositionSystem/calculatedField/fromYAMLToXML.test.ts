import { describe, expect, it } from "vitest"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
  appearanceCalculatedField,
  availableValuesCalculatedField,
  fullCalculatedField,
  fullCalculatedFieldYAML,
  appearanceCalculatedFieldYAML,
  availableValuesCalculatedFieldYAML,
} from "./__fixtures__/data"
import "./types"

describe("export CalculatedField to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "CalculatedField" },
      value: fullCalculatedField,
      yaml: fullCalculatedFieldYAML,
      xmlRootTag: "CalculatedField",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports appearance.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "CalculatedField" },
      value: appearanceCalculatedField,
      yaml: appearanceCalculatedFieldYAML,
      xmlRootTag: "CalculatedField",
      path: "appearance.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports availableValues.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "CalculatedField" },
      value: availableValuesCalculatedField,
      yaml: availableValuesCalculatedFieldYAML,
      xmlRootTag: "CalculatedField",
      path: "availableValues.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
