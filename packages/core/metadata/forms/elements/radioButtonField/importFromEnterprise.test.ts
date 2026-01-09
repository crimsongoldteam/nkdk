import { describe, expect, it } from "vitest"
import {
  fullRadioButtonField,
  fullRadioButtonFieldEnterprise,
  minimalRadioButtonField,
  minimalRadioButtonFieldEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockСontext } from "~/tests/mockContext"
import { importRadioButtonFieldFromEnterprise } from "./importFromEnterprise"

describe("importRadioButtonFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importRadioButtonFieldFromEnterprise(mockСontext, undefined, fullRadioButtonField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importRadioButtonFieldFromEnterprise(
      mockСontext,
      fullRadioButtonFieldEnterprise,
      fullRadioButtonField.name
    )

    expect(result).toEqual(fullRadioButtonField)
  })

  it("should import minimal", () => {
    const result = importRadioButtonFieldFromEnterprise(
      mockСontext,
      minimalRadioButtonFieldEnterprise,
      minimalRadioButtonField.name
    )

    expect(result).toEqual(minimalRadioButtonField)
  })
})

