import { describe, expect, it } from "vitest"
import { enumChoiceParameter } from "~/tests/fixtures/choiceParameter/enum"
import { fixedArrayChoiceParameter } from "~/tests/fixtures/choiceParameter/fixedArray"
import { multipleChoiceParameters } from "~/tests/fixtures/choiceParameter/multiple"
import { singleChoiceParameter } from "~/tests/fixtures/choiceParameter/single"
import { stringChoiceParameter } from "~/tests/fixtures/choiceParameter/string"
import { mockСontext } from "~/tests/mockContext"
import { exportChoiceParameterLinksToEnterprise } from "./exportToEnterprise"

describe("exportChoiceParametersToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParameterLinksToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single choice parameter to enterprise", () => {
    const data = singleChoiceParameter
    const expectedResult = "Отбор.ВАрхиве(Ложь)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple choice parameters to enterprise", () => {
    const data = multipleChoiceParameters
    const expectedResult = "Отбор.ВАрхиве(Ложь), Отбор.Недействителен(Ложь)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with enum value to enterprise", () => {
    const data = enumChoiceParameter
    const expectedResult = "Отбор.ТипСчета(Перечисление.ТипыСчетов.ВнеоборотныеАктивы)"

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with string value to enterprise", () => {
    const data = stringChoiceParameter
    const expectedResult = 'Дополнительно.ТипВладельца("ЗаказПокупателя")'

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
})
