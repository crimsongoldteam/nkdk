import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { fullViewStatusAddition, fullViewStatusAdditionYAML } from "~/metadata/forms/elements/viewStatusAddition/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "ViewStatusAddition",
  yaml: "ОтображениеСостоянияПросмотра",
}

describe("exportViewStatusAdditionToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export all fields to YAML", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: fullViewStatusAddition,
    })

    expect(result).toHaveProperty("ОтображениеСостоянияПросмотра", fullViewStatusAdditionYAML)
  })
})
