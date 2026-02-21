import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { exportSystemEnumerationToEnterprise } from "./toEnterprise"

describe("exportSystemEnumerationToEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportSystemEnumerationToEnterprise({
      context: mockContext,
      rule: { type: "SystemEnumeration", typeSE: "DynamicListSearchStringViewMode" },
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should return SystemEnumerationEnterprise with correct type and value", () => {
    const result = exportSystemEnumerationToEnterprise({
      context: mockContext,
      rule: { type: "SystemEnumeration", typeSE: "DynamicListSearchStringViewMode" },
      value: "Auto",
    })

    expect(result).toEqual({
      Type: "SystemEnumeration",
      Value: "DynamicListSearchStringViewMode.Auto",
    })
  })
})
