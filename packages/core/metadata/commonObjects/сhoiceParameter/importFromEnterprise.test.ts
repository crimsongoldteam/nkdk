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
} from "~/tests/fixtures/choiceParameter/data"
import { mockСontext } from "~/tests/mockContext"
import { importChoiceParametersFromEnterprise } from "./importFromEnterprise"

describe("importChoiceParametersFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single choice parameter from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockСontext, singleChoiceParametersEnterprise)

    expect(result).toEqual(singleChoiceParameter)
  })

  it("should import multiple choice parameters from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockСontext, multipleChoiceParametersEnterprise)

    expect(result).toEqual(multipleChoiceParameters)
  })

  it("should import choice parameters with enum value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockСontext, enumChoiceParametersEnterprise)

    expect(result).toEqual(enumChoiceParameter)
  })

  it("should import choice parameters with string value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockСontext, stringChoiceParametersEnterprise)

    expect(result).toEqual(stringChoiceParameter)
  })

  it("should import choice parameters with fixedArray value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockСontext, fixedArrayChoiceParametersEnterprise)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("should import choice parameters with nil value from enterprise", () => {
    const result = importChoiceParametersFromEnterprise(mockСontext, nilChoiceParametersEnterprise)

    expect(result).toEqual(nilChoiceParameters)
  })
})
