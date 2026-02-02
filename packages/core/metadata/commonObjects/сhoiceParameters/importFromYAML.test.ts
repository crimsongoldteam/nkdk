import { describe, expect, it } from "vitest"

import {
  enumChoiceParameter,
  enumChoiceParametersEnterprise,
  fixedArrayChoiceParameter,
  fixedArrayChoiceParametersEnterprise,
  multipleChoiceParameters,
  multipleChoiceParametersEnterprise,
  nilChoiceParameters,
  nilChoiceParametersEnterprise,
  singleChoiceParameter,
  singleChoiceParametersEnterprise,
  stringChoiceParameter,
  stringChoiceParametersEnterprise,
  withoutOneValueChoiceParameter,
  withoutOneValueChoiceParametersEnterprise,
  withoutValueChoiceParameter,
  withoutValueChoiceParametersEnterprise,
} from "~/tests/fixtures/choiceParameters/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importChoiceParametersFromYAML } from "./importFromYAML"

describe("importChoiceParametersFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single choice parameter from YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, singleChoiceParametersEnterprise)

    expect(result).toEqual(singleChoiceParameter)
  })

  it("should import multiple choice parameters from YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, multipleChoiceParametersEnterprise)

    expect(result).toEqual(multipleChoiceParameters)
  })

  it("should import choice parameters with enum value from YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, enumChoiceParametersEnterprise)

    expect(result).toEqual(enumChoiceParameter)
  })

  it("should import choice parameters with string value from YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, stringChoiceParametersEnterprise)

    expect(result).toEqual(stringChoiceParameter)
  })

  it("should import choice parameters with fixedArray value from YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, fixedArrayChoiceParametersEnterprise)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("should import choice parameters with nil value from YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, nilChoiceParametersEnterprise)

    expect(result).toEqual(nilChoiceParameters)
  })

  it("should import choice parameters without value from YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, withoutValueChoiceParametersEnterprise)

    expect(result).toEqual(withoutValueChoiceParameter)
  })

  it("should import choice parameters without one value from YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, withoutOneValueChoiceParametersEnterprise)

    expect(result).toEqual(withoutOneValueChoiceParameter)
  })
})
