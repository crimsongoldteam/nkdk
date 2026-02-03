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
import { exportChoiceParametersToEnterprise } from "./exportToEnterprise"

describe("exportChoiceParametersToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single choice parameter to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, singleChoiceParameter)

    expect(result).toEqual(singleChoiceParametersEnterprise)
  })

  it("should export multiple choice parameters to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, multipleChoiceParameters)

    expect(result).toEqual(multipleChoiceParametersEnterprise)
  })

  it("should export choice parameters with enum value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, enumChoiceParameter)

    expect(result).toEqual(enumChoiceParametersEnterprise)
  })

  it("should export choice parameters with string value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, stringChoiceParameter)

    expect(result).toEqual(stringChoiceParametersEnterprise)
  })

  it("should export choice parameters with fixedArray value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, fixedArrayChoiceParameter)

    expect(result).toEqual(fixedArrayChoiceParametersEnterprise)
  })

  it("should export choice parameters with nil value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, nilChoiceParameters)

    expect(result).toEqual(nilChoiceParametersEnterprise)
  })

  it("should export choice parameters without value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, withoutValueChoiceParameter)

    expect(result).toEqual(withoutValueChoiceParametersEnterprise)
  })

  it("should export choice parameters without one value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockContext, mockRule, withoutOneValueChoiceParameter)

    expect(result).toEqual(withoutOneValueChoiceParametersEnterprise)
  })
})
