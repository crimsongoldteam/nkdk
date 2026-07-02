import { describe, expect, it } from "vitest"

import {
  emptyFormChoiceParameter,
  emptyFormChoiceParametersYAML,
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
} from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { importFromYAML } from "../../../yaml/import"
import { importChoiceParametersFromYAML } from "./fromYAML"
import type { ChoiceParametersYAML } from "./types"

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

  it("imports double-quoted numeric-looking YAML scalar as string value", () => {
    const yaml = importFromYAML<ChoiceParametersYAML>('Отбор.Код: "456"')
    const result = importChoiceParametersFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([
      {
        name: "Отбор.Код",
        value: { type: "string", value: "456" },
      },
    ])
  })

  it("should import choice parameters with fixedArray value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, fixedArrayChoiceParametersYAML)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("imports fixedArrayWithNil YAML", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, fixedArrayWithNilChoiceParameterYAML)

    expect(result).toEqual(fixedArrayWithNilChoiceParameters)
  })

  it("imports choice parameters with form boolean value from yaml object", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, formBooleanChoiceParametersYAML)

    expect(result).toEqual(formBooleanChoiceParameter)
  })

  it("imports choice parameters with form enum value from yaml object", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, formEnumChoiceParametersYAML)

    expect(result).toEqual(formEnumChoiceParameter)
  })

  it("imports empty explicit top-level form choice value", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, emptyFormChoiceParametersYAML)

    expect(result).toEqual(emptyFormChoiceParameter)
  })

  it("should import choice parameters with nil value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, nilChoiceParametersYAML)

    expect(result).toStrictEqual(nilChoiceParameters)
    expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
  })

  it("imports YAML null choice parameter as parameter without value", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, {
      ВыборСчетовГоловнойОрганизации: null,
    } as ChoiceParametersYAML)

    expect(result).toStrictEqual([
      {
        name: "ВыборСчетовГоловнойОрганизации",
      },
    ])
    expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
  })

  it("imports empty object choice parameter as parameter without value", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, {
      ВыборДействующихМаршрутныхКарт: {},
    } as ChoiceParametersYAML)

    expect(result).toStrictEqual([
      {
        name: "ВыборДействующихМаршрутныхКарт",
      },
    ])
    expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
  })

  it("should import choice parameters without value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, withoutValueChoiceParametersYAML)

    expect(result).toStrictEqual(withoutValueChoiceParameter)
    expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
  })

  it("should import choice parameters without one value from yaml", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, withoutOneValueChoiceParametersYAML)

    expect(result).toStrictEqual(withoutOneValueChoiceParameter)
    expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
  })
})
