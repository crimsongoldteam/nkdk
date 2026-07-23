import { describe, expect, it } from "vitest"
import type { PropertyRule } from "../../../orchestration/property/types"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { dcsOrderItemFieldsFixture, dcsOrderItemFieldsYAMLFixture } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = {
  type: "OrderItemFields",
  yaml: "Порядок",
}

describe("export OrderItemFields to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyModelThroughXMLToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports full fixture", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: dcsOrderItemFieldsFixture,
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual({ Порядок: dcsOrderItemFieldsYAMLFixture })
  })
})
