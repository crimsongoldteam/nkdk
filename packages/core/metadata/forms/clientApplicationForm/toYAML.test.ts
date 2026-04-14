import { describe, expect, it } from "vitest"
import {
  fullClientApplicationForm,
  fullClientApplicationFormYAML,
  minimalClientApplicationForm,
  minimalClientApplicationFormYAML,
} from "./__fixtures__/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportClientApplicationFormToYAML } from "./toYAML"

describe("exportClientApplicationFormToYAML", () => {
  // it("should return undefined when data is undefined", () => {
  //   const result = exportClientApplicationFormToYAML(mockContext, undefined)

  //   expect(result).toBeUndefined()
  // })

  it("should export all fields to YAML", () => {
    const result = exportClientApplicationFormToYAML(mockContextToYAML, fullClientApplicationForm)

    expect(result).toEqual(fullClientApplicationFormYAML)
  })

  it("should export minimal", () => {
    const result = exportClientApplicationFormToYAML(mockContextToYAML, minimalClientApplicationForm)

    expect(result).toEqual(minimalClientApplicationFormYAML)
  })
})
