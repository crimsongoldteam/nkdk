import { it, expect } from "vitest"
import { TAttribute } from "../types"
import formatFormAttributes from "./formatFormAttributes"

it("should format form attributes", () => {
  const expectedResult = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

  const orignalContent: TAttribute[] = [
    {
      name: "ИмяАтрибута",
      id: "1",
      title: { ru: "Атрибут" },
      type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
    },
  ]

  const result = formatFormAttributes(orignalContent)

  expect(result).toEqual([expectedResult])
})

it("should format main attribute", () => {
  const expectedResult = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)
  ОсновнойАтрибут: Истина`
  const orignalContent: TAttribute[] = [
    {
      name: "ИмяАтрибута",
      id: "1",
      title: { ru: "Атрибут" },
      type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
      mainAttribute: true,
    },
  ]

  const result = formatFormAttributes(orignalContent)

  expect(result).toEqual([expectedResult])
})

it("should format stored data", () => {
  const expectedResult = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)
  СохраняемыеДанные: Истина`
  const orignalContent: TAttribute[] = [
    {
      name: "ИмяАтрибута",
      id: "1",
      title: { ru: "Атрибут" },
      type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
      storedData: true,
    },
  ]

  const result = formatFormAttributes(orignalContent)

  expect(result).toEqual([expectedResult])
})

it("should format compact if title is undefined and mainAttribute is false and storedData is false", () => {
  const expectedResult = `ИмяАтрибута: Строка(10)`
  const orignalContent: TAttribute[] = [
    {
      name: "ИмяАтрибута",
      id: "1",
      type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
    },
  ]

  const result = formatFormAttributes(orignalContent)

  expect(result).toEqual([expectedResult])
})
