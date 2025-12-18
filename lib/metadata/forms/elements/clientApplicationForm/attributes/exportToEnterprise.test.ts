import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { FormAttribute } from "../types"
import exportFormAttributesToEnterprise from "./exportToEnterprise"

describe("exportFormAttributesToEnterprise", () => {
  it("should format form attributes", () => {
    const expectedResult = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

    const orignalContent: FormAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "1",
        title: { items: { ru: "Атрибут" } },
        type: {
          type: ["string"],
          stringQualifiers: { length: 10, allowedLength: "Variable" },
        },
      },
    ]

    const result = exportFormAttributesToEnterprise(orignalContent, mockConfigurationSettings)

    expect(result).toEqual([expectedResult])
  })

  it("should short format with title equal camelCase of name", () => {
    const expectedResult = `ИмяАтрибута: Строка`
    const orignalContent: FormAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "1",
        title: { items: { ru: "Имя атрибута" } },
        type: { type: ["string"] },
      },
    ]

    const result = exportFormAttributesToEnterprise(orignalContent, mockConfigurationSettings)

    expect(result).toEqual([expectedResult])
  })

  it("should full format with title equal camelCase of name", () => {
    const expectedResult = `ИмяАтрибута: 
  Тип: Строка(10)
  ОсновнойАтрибут: Истина`
    const orignalContent: FormAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "1",
        title: { items: { ru: "Имя атрибута" } },
        type: {
          type: ["string"],
          stringQualifiers: { length: 10, allowedLength: "Variable" },
        },
        mainAttribute: true,
      },
    ]

    const result = exportFormAttributesToEnterprise(orignalContent, mockConfigurationSettings)

    expect(result).toEqual([expectedResult])
  })

  it("should format main attribute", () => {
    const expectedResult = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)
  ОсновнойАтрибут: Истина`
    const orignalContent: FormAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "1",
        title: { items: { ru: "Атрибут" } },
        type: {
          type: ["string"],
          stringQualifiers: { length: 10, allowedLength: "Variable" },
        },
        mainAttribute: true,
      },
    ]

    const result = exportFormAttributesToEnterprise(orignalContent, mockConfigurationSettings)

    expect(result).toEqual([expectedResult])
  })

  it("should format stored data", () => {
    const expectedResult = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)
  СохраняемыеДанные: Истина`
    const orignalContent: FormAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "1",
        title: { items: { ru: "Атрибут" } },
        type: {
          type: ["string"],
          stringQualifiers: { length: 10, allowedLength: "Variable" },
        },
        storedData: true,
      },
    ]

    const result = exportFormAttributesToEnterprise(orignalContent, mockConfigurationSettings)

    expect(result).toEqual([expectedResult])
  })

  it("should format compact if title is undefined and mainAttribute is false and storedData is false", () => {
    const expectedResult = `ИмяАтрибута: Строка(10)`
    const orignalContent: FormAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "1",
        type: {
          type: ["string"],
          stringQualifiers: { length: 10, allowedLength: "Variable" },
        },
      },
    ]

    const result = exportFormAttributesToEnterprise(orignalContent, mockConfigurationSettings)

    expect(result).toEqual([expectedResult])
  })

  it("should format `use`", () => {
    const orignalContent: FormAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "1",
        title: { items: { ru: "Атрибут" } },
        type: { type: ["string"] },
        use: {
          common: true,
          values: [
            { name: "Администратор", value: true },
            { name: "Пользователь", value: false },
          ],
        },
      },
    ]

    const expectedResult = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка
  РазрешитьИспользование:
    Администратор: Истина
    Пользователь: Ложь`

    const result = exportFormAttributesToEnterprise(orignalContent, mockConfigurationSettings)

    expect(result).toEqual([expectedResult])
  })
})
