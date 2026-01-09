import { describe, expect, it } from "vitest"
import { fullPeriodField, fullPeriodFieldEnterprise, minimalPeriodField, minimalPeriodFieldEnterprise } from "~/tests/fixtures/forms/periodField/data"
import { mockСontext } from "~/tests/mockContext"
import { importPeriodFieldFromEnterprise } from "./importFromEnterprise"

describe("importPeriodFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPeriodFieldFromEnterprise(mockСontext, undefined, fullPeriodField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPeriodFieldFromEnterprise(mockСontext, fullPeriodFieldEnterprise, fullPeriodField.name)

    expect(result).toEqual(fullPeriodField)
  })

  it("should import minimal", () => {
    const result = importPeriodFieldFromEnterprise(mockСontext, minimalPeriodFieldEnterprise, minimalPeriodField.name)

    expect(result).toEqual(minimalPeriodField)
  })
})

