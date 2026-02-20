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
import { importChoiceParametersFromYAML } from "./fromYAML"

describe("importChoiceParametersFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single choice parameter from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, singleChoiceParametersYAML)

    expect(result).toEqual(singleChoiceParameter)
  })

  it("should import multiple choice parameters from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, multipleChoiceParametersYAML)

    expect(result).toEqual(multipleChoiceParameters)
  })

  it("should import choice parameters with enum value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, enumChoiceParametersYAML)

    expect(result).toEqual(enumChoiceParameter)
  })

  it("should import choice parameters with string value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, stringChoiceParametersYAML)

    expect(result).toEqual(stringChoiceParameter)
  })

  it("should import choice parameters with fixedArray value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, fixedArrayChoiceParametersYAML)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("should import choice parameters with nil value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, nilChoiceParametersYAML)

    expect(result).toEqual(nilChoiceParameters)
  })

  it("should import choice parameters without value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, withoutValueChoiceParametersYAML)

    expect(result).toEqual(withoutValueChoiceParameter)
  })

  it("should import choice parameters without one value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, withoutOneValueChoiceParametersYAML)

    expect(result).toEqual(withoutOneValueChoiceParameter)
  })
})
