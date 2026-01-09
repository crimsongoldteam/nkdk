import { describe, expect, it } from "vitest"
import {
  fullCheckBoxField,
  fullCheckBoxFieldEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockСontext } from "~/tests/mockContext"
import { importCheckBoxFieldFromEnterprise } from "./importFromEnterprise"

describe("importCheckBoxFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCheckBoxFieldFromEnterprise(mockСontext, undefined, fullCheckBoxField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importCheckBoxFieldFromEnterprise(mockСontext, fullCheckBoxFieldEnterprise, fullCheckBoxField.name)

    expect(result).toEqual(fullCheckBoxField)
  })

  it("should import minimal", () => {
    const result = importCheckBoxFieldFromEnterprise(
      mockСontext,
      minimalCheckBoxFieldEnterprise,
      minimalCheckBoxField.name
    )

    expect(result).toEqual(minimalCheckBoxField)
  })
})
