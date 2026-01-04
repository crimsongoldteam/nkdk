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
  withoutValueChoiceParameter,
  withoutValueChoiceParametersEnterprise,
} from "~/tests/fixtures/choiceParameters/data"
import { mockСontext } from "~/tests/mockContext"
import { exportChoiceParametersToEnterprise } from "./exportToEnterprise"

describe("exportChoiceParametersToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParametersToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single choice parameter to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockСontext, singleChoiceParameter)

    expect(result).toEqual(singleChoiceParametersEnterprise)
  })

  it("should export multiple choice parameters to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockСontext, multipleChoiceParameters)

    expect(result).toEqual(multipleChoiceParametersEnterprise)
  })

  it("should export choice parameters with enum value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockСontext, enumChoiceParameter)

    expect(result).toEqual(enumChoiceParametersEnterprise)
  })

  it("should export choice parameters with string value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockСontext, stringChoiceParameter)

    expect(result).toEqual(stringChoiceParametersEnterprise)
  })

  it("should export choice parameters with fixedArray value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockСontext, fixedArrayChoiceParameter)

    expect(result).toEqual(fixedArrayChoiceParametersEnterprise)
  })

  it("should export choice parameters with nil value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockСontext, nilChoiceParameters)

    expect(result).toEqual(nilChoiceParametersEnterprise)
  })

  it("should export choice parameters without value to enterprise", () => {
    const result = exportChoiceParametersToEnterprise(mockСontext, withoutValueChoiceParameter)

    expect(result).toEqual(withoutValueChoiceParametersEnterprise)
  })
})
