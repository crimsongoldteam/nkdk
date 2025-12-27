import { describe, expect, it } from "vitest"
import { enumChoiceParameter } from "~/tests/fixtures/choiceParameter/enum"
import { fixedArrayChoiceParameter } from "~/tests/fixtures/choiceParameter/fixedArray"
import { multipleChoiceParameters } from "~/tests/fixtures/choiceParameter/multiple"
import { singleChoiceParameter } from "~/tests/fixtures/choiceParameter/single"
import { stringChoiceParameter } from "~/tests/fixtures/choiceParameter/string"
import { mockСontext } from "~/tests/mockContext"
import { importChoiceParametersFromEnterprise } from "./importFromEnterprise"

describe("importChoiceParametersFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single choice parameter from enterprise", () => {
    const data = "Отбор.ВАрхиве(Ложь)"
    const expectedResult = singleChoiceParameter

    const result = importChoiceParametersFromEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should import multiple choice parameters from enterprise", () => {
    const data = "Отбор.ВАрхиве(Ложь), Отбор.Недействителен(Ложь)"
    const expectedResult = multipleChoiceParameters

    const result = importChoiceParametersFromEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with enum value from enterprise", () => {
    const data = "Отбор.ТипСчета(Перечисление.ТипыСчетов.ВнеоборотныеАктивы)"
    const expectedResult = enumChoiceParameter

    const result = importChoiceParametersFromEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with string value from enterprise", () => {
    const data = 'Дополнительно.ТипВладельца("ЗаказПокупателя")'
    const expectedResult = stringChoiceParameter

    const result = importChoiceParametersFromEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with fixedArray value from enterprise", () => {
    const data =
      "Отбор.ТипСтруктурнойЕдиницы(Перечисление.ТипыСтруктурныхЕдиниц.Склад, Перечисление.ТипыСтруктурныхЕдиниц.Розница, Перечисление.ТипыСтруктурныхЕдиниц.РозницаСуммовойУчет)"
    const expectedResult = fixedArrayChoiceParameter

    const result = importChoiceParametersFromEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })
})
