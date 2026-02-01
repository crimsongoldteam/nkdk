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
import { mockContext } from "~/tests/mockContext"
import { importChoiceParametersFromEnterprise } from "./importFromEnterprise"

describe("importChoiceParametersFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single choice parameter from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, singleChoiceParametersEnterprise)

    expect(result).toEqual(singleChoiceParameter)
  })

  it("should import multiple choice parameters from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, multipleChoiceParametersEnterprise)

    expect(result).toEqual(multipleChoiceParameters)
  })

  it("should import choice parameters with enum value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, enumChoiceParametersEnterprise)

    expect(result).toEqual(enumChoiceParameter)
  })

  it("should import choice parameters with string value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, stringChoiceParametersEnterprise)

    expect(result).toEqual(stringChoiceParameter)
  })

  it("should import choice parameters with fixedArray value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, fixedArrayChoiceParametersEnterprise)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("should import choice parameters with nil value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, nilChoiceParametersEnterprise)

    expect(result).toEqual(nilChoiceParameters)
  })

  it("should import choice parameters without value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, withoutValueChoiceParametersEnterprise)

    expect(result).toEqual(withoutValueChoiceParameter)
  })

  it("should import choice parameters without one value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockContext, withoutOneValueChoiceParametersEnterprise)

    expect(result).toEqual(withoutOneValueChoiceParameter)
  })
})
