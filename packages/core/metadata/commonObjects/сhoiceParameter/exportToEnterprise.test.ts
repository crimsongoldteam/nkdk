import { describe, expect, it } from "vitest"
import { formEnumChoiceParameter } from "~/lib/tests/fixtures/choiceParameter/formEnum"
import { enumChoiceParameter } from "~/packages/core/tests/fixtures/choiceParameter/enum"
import { fixedArrayChoiceParameter } from "~/packages/core/tests/fixtures/choiceParameter/fixedArray"
import { formBooleanChoiceParameter } from "~/packages/core/tests/fixtures/choiceParameter/formBoolean"
import { multipleChoiceParameters } from "~/packages/core/tests/fixtures/choiceParameter/multiple"
import { singleChoiceParameter } from "~/packages/core/tests/fixtures/choiceParameter/single"
import { stringChoiceParameter } from "~/packages/core/tests/fixtures/choiceParameter/string"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { exportChoiceParameterLinksToEnterprise } from "./exportToEnterprise"

describe("exportChoiceParametersToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParameterLinksToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single choice parameter to enterprise", () => {
    const data = singleChoiceParameter
    const expectedResult = "Отбор.ВАрхиве(Булево: Ложь)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple choice parameters to enterprise", () => {
    const data = multipleChoiceParameters
    const expectedResult = "Отбор.ВАрхиве(Булево:Ложь), Отбор.Недействителен(Булево:Ложь)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with enum value to enterprise", () => {
    const data = enumChoiceParameter
    const expectedResult = "Отбор.ТипСчета(Enum.ТипыСчетов.EnumValue.ВнеоборотныеАктивы)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with string value to enterprise", () => {
    const data = stringChoiceParameter
    const expectedResult = "Дополнительно.ТипВладельца(ЗаказПокупателя)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with fixedArray value to enterprise", () => {
    const data = fixedArrayChoiceParameter
    const expectedResult =
      "Отбор.ТипСтруктурнойЕдиницы(Перечисление.ТипыСтруктурныхЕдиниц.Склад, Перечисление.ТипыСтруктурныхЕдиниц.Розница, Перечисление.ТипыСтруктурныхЕдиниц.РозницаСуммовойУчет)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form boolean value to enterprise", () => {
    const data = formBooleanChoiceParameter
    const expectedResult = "БезПроизводныхЗначений(Булево: Истина)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form enum value to enterprise", () => {
    const data = formEnumChoiceParameter
    const expectedResult = "Отбор.ТипСчета(Enum.ТипыСчетов.EnumValue.НераспределеннаяПрибыль)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })
})
