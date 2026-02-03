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
import { importChoiceParametersFromEnterprise } from "./importFromEnterprise"

describe("importChoiceParametersFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single choice parameter from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, mockRule, singleChoiceParametersEnterprise)

    expect(result).toEqual(singleChoiceParameter)
  })

  it("should import multiple choice parameters from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, mockRule, multipleChoiceParametersEnterprise)

    expect(result).toEqual(multipleChoiceParameters)
  })

  it("should import choice parameters with enum value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, mockRule, enumChoiceParametersEnterprise)

    expect(result).toEqual(enumChoiceParameter)
  })

  it("should import choice parameters with string value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, mockRule, stringChoiceParametersEnterprise)

    expect(result).toEqual(stringChoiceParameter)
  })

  it("should import choice parameters with fixedArray value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, mockRule, fixedArrayChoiceParametersEnterprise)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("should import choice parameters with nil value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, mockRule, nilChoiceParametersEnterprise)

    expect(result).toEqual(nilChoiceParameters)
  })

  it("should import choice parameters without value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, mockRule, withoutValueChoiceParametersEnterprise)

    expect(result).toEqual(withoutValueChoiceParameter)
  })

  it("should import choice parameters without one value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(
      mockContext,
      mockRule,
      withoutOneValueChoiceParametersEnterprise
    )

    expect(result).toEqual(withoutOneValueChoiceParameter)
  })
})
