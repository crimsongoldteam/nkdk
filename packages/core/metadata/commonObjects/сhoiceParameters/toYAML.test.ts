import { describe, expect, it } from "vitest"

import {
  enumChoiceParameter,
  enumChoiceParametersYAML,
  fixedArrayChoiceParameter,
  fixedArrayChoiceParametersYAML,
  multipleChoiceParameters,
  multipleChoiceParametersYAML,
  nilChoiceParameters,
  nilChoiceParametersYAML,
  singleChoiceParameter,
  singleChoiceParametersYAML,
  stringChoiceParameter,
  stringChoiceParametersYAML,
  withoutOneValueChoiceParameter,
  withoutOneValueChoiceParametersYAML,
  withoutValueChoiceParameter,
  withoutValueChoiceParametersYAML,
} from "~/tests/fixtures/choiceParameters/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportChoiceParametersToYAML } from "./toYAML"

describe("exportChoiceParametersToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single choice parameter to enterprise", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, singleChoiceParameter)

    expect(result).toEqual(singleChoiceParametersYAML)
  })

  it("should export multiple choice parameters to enterprise", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, multipleChoiceParameters)

    expect(result).toEqual(multipleChoiceParametersYAML)
  })

  it("should export choice parameters with enum value to enterprise", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, enumChoiceParameter)

    expect(result).toEqual(enumChoiceParametersYAML)
  })

  it("should export choice parameters with string value to enterprise", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, stringChoiceParameter)

    expect(result).toEqual(stringChoiceParametersYAML)
  })

  it("should export choice parameters with fixedArray value to enterprise", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, fixedArrayChoiceParameter)

    expect(result).toEqual(fixedArrayChoiceParametersYAML)
  })

  it("should export choice parameters with nil value to enterprise", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, nilChoiceParameters)

    expect(result).toEqual(nilChoiceParametersYAML)
  })

  it("should export choice parameters without value to enterprise", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, withoutValueChoiceParameter)

    expect(result).toEqual(withoutValueChoiceParametersYAML)
  })

  it("should export choice parameters without one value to enterprise", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, withoutOneValueChoiceParameter)

    expect(result).toEqual(withoutOneValueChoiceParametersYAML)
  })
})
