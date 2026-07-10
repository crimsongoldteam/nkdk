import { describe, expect, it } from "vitest"
import type { PropertyRule } from "../../../orchestration/property/types"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
import { dcsOrderItemFieldsFixture, dcsOrderItemFieldsYAMLFixture } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = {
  type: "OrderItemFields",
  yaml: "Порядок",
}

describe("export OrderItemFields to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports full fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: dcsOrderItemFieldsFixture })
    expect(result).toEqual({ Порядок: dcsOrderItemFieldsYAMLFixture })
  })
})
