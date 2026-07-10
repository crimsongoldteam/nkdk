import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromYAML } from "../../../../tests/property/importPropertyFromYAML"
import { dcsOrderItemFieldsFixture, dcsOrderItemFieldsYAMLFixture } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = { type: "OrderItemFields" }

describe("import OrderItemFields from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: dcsOrderItemFieldsYAMLFixture })
    expect(result).toEqual(dcsOrderItemFieldsFixture)
  })
})
