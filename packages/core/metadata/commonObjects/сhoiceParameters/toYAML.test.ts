import { describe, expect, it } from "vitest"

import {
  enumChoiceParameter,
  enumChoiceParametersYAML,
  fixedArrayChoiceParameter,
  fixedArrayChoiceParametersYAML,
  fixedArrayWithNilChoiceParameterYAML,
  fixedArrayWithNilChoiceParameters,
  formBooleanChoiceParameter,
  formBooleanChoiceParametersYAML,
  formEnumChoiceParameter,
  formEnumChoiceParametersYAML,
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
} from "~/metadata/commonObjects/сhoiceParameters/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportChoiceParametersToYAML } from "./toYAML"

describe("exportChoiceParametersToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single choice parameter to yaml", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, singleChoiceParameter)

    expect(result).toEqual(singleChoiceParametersYAML)
  })

  it("should export multiple choice parameters to yaml", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, multipleChoiceParameters)

    expect(result).toEqual(multipleChoiceParametersYAML)
  })

  it("should export choice parameters with enum value to yaml", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, enumChoiceParameter)

    expect(result).toEqual(enumChoiceParametersYAML)
  })

  it("should export choice parameters with string value to yaml", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, stringChoiceParameter)

    expect(result).toEqual(stringChoiceParametersYAML)
  })

  it("should export choice parameters with fixedArray value to yaml", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, fixedArrayChoiceParameter)

    expect(result).toEqual(fixedArrayChoiceParametersYAML)
  })

  it("exports fixedArrayWithNil YAML", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, fixedArrayWithNilChoiceParameters)

    expect(result).toEqual(fixedArrayWithNilChoiceParameterYAML)
  })

  it("exports choice parameters with form boolean value to yaml object", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, formBooleanChoiceParameter)

    expect(result).toEqual(formBooleanChoiceParametersYAML)
  })

  it("exports choice parameters with form enum value to yaml object", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, formEnumChoiceParameter)

    expect(result).toEqual(formEnumChoiceParametersYAML)
  })

  it("should export choice parameters with nil value to yaml", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, nilChoiceParameters)

    expect(result).toEqual(nilChoiceParametersYAML)
  })

  it("should export choice parameters without value to yaml", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, withoutValueChoiceParameter)

    expect(result).toEqual(withoutValueChoiceParametersYAML)
  })

  it("should export choice parameters without one value to yaml", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, withoutOneValueChoiceParameter)

    expect(result).toEqual(withoutOneValueChoiceParametersYAML)
  })
})
