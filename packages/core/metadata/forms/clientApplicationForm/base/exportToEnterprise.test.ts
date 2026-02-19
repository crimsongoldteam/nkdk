import { describe, expect, it } from "vitest"
import {
  fullClientApplicationForm,
  fullClientApplicationFormEnterprise,
  minimalClientApplicationForm,
  minimalClientApplicationFormEnterprise,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportClientApplicationFormToEnterprise } from "./exportToEnterprise"

describe("exportClientApplicationFormToEnterprise", () => {
  // it("should return undefined when data is undefined", () => {
  //   const result = exportClientApplicationFormToEnterprise(mockContext, undefined)

  //   expect(result).toBeUndefined()
  // })

  it("should export all fields to Enterprise", () => {
    const result = exportClientApplicationFormToEnterprise(mockContextToYAML, fullClientApplicationForm)

    expect(result).toEqual(fullClientApplicationFormEnterprise)
  })

  it("should export minimal", () => {
    const result = exportClientApplicationFormToEnterprise(mockContextToYAML, minimalClientApplicationForm)

    expect(result).toEqual(minimalClientApplicationFormEnterprise)
  })
})
