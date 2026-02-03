import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/inputField/exportToEnterprise"
import {
  fullClientApplicationForm,
  fullClientApplicationFormEnterprise,
  minimalClientApplicationForm,
  minimalClientApplicationFormEnterprise,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportClientApplicationFormToEnterprise } from "./exportToEnterprise"

describe("exportClientApplicationFormToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportClientApplicationFormToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportClientApplicationFormToEnterprise(mockContext, mockRule, fullClientApplicationForm)

    expect(result).toEqual(fullClientApplicationFormEnterprise)
  })

  it("should export minimal", () => {
    const result = exportClientApplicationFormToEnterprise(mockContext, mockRule, minimalClientApplicationForm)

    expect(result).toEqual(minimalClientApplicationFormEnterprise)
  })
})
