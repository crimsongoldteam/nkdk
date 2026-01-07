import { describe, expect, it } from "vitest"
import { fullLabelField, fullLabelFieldEnterprise, minimalLabelField, minimalLabelFieldEnterprise } from "~/tests/fixtures/forms/labelField/data"
import { mockСontext } from "~/tests/mockContext"
import { importLabelFieldFromEnterprise } from "./importFromEnterprise"

describe("importLabelFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importLabelFieldFromEnterprise(mockСontext, undefined, fullLabelField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importLabelFieldFromEnterprise(mockСontext, fullLabelFieldEnterprise, fullLabelField.name)
    result!.id = "1"

    expect(result).toEqual(fullLabelField)
  })

  it("should import minimal", () => {
    const result = importLabelFieldFromEnterprise(mockСontext, minimalLabelFieldEnterprise, minimalLabelField.name)
    result!.id = "1"

    expect(result).toEqual(minimalLabelField)
  })
})

