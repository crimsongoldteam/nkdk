import { describe, expect, it } from "vitest"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import { fullViewStatusAddition, fullViewStatusAdditionYAML } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = { type: "ViewStatusAddition" }

describe("importViewStatusAdditionFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: fullViewStatusAdditionYAML,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  // it("should import minimal", () => {
  //   const result = importPropertyFromYAML({
  //     context: mockContext,
  //     rule: rule,
  //     value: minimalViewStatusAdditionYAML,
  //   })

  //   expect(result).toBeUndefined()
  // })
})
