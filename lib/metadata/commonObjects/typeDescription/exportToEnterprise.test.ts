import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "../../../tests/mockConfigurationSettings"
import { exportTypeDescriptionToEnterprise } from "./exportToEnterprise"
import { TypeDescription } from "./types"

describe("exportTypeDescriptionToEnterprise", () => {
  it("should format undefined type description", () => {
    const result = exportTypeDescriptionToEnterprise(undefined, mockConfigurationSettings)
    expect(result).toBeUndefined()
  })

  describe("string type description", () => {
    it("should format string", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string"],
        stringQualifiers: { length: 10, allowedLength: "Variable" },
      }
      const expectedResult = "Строка(10)"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })

    it("should format unlimited string", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string"],
        stringQualifiers: { length: 0, allowedLength: "Variable" },
      }
      const expectedResult = "Строка"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })

    it("should format fixed string", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string"],
        stringQualifiers: { length: 100, allowedLength: "Fixed" },
      }
      const expectedResult = "ФиксированнаяСтрока(100)"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })
  })

  describe("number type description", () => {
    it("should format number", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["number"],
        numberQualifiers: { digits: 10, fractionDigits: 2 },
      }
      const expectedResult = "Число(10, 2)"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })

    it("should format non-negative number", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["number"],
        numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Nonnegative" },
      }
      const expectedResult = "НеотрицательноеЧисло(10, 2)"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })
  })

  describe("date type description", () => {
    it("should format date", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["date"],
        dateQualifiers: { dateFractions: "Date" },
      }

      const expectedResult = "Дата"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })

    it("should format time", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["date"],
        dateQualifiers: { dateFractions: "Time" },
      }

      const expectedResult = "Время"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })

    it("should format date and time", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["date"],
        dateQualifiers: { dateFractions: "DateTime" },
      }

      const expectedResult = "ДатаВремя"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })

    it("should format date", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["date"],
        dateQualifiers: { dateFractions: "Date" },
      }

      const expectedResult = "Дата"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })
  })

  describe("boolean type description", () => {
    it("should format boolean", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["boolean"],
      }

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual("Булево")
    })
  })

  describe("composite type description", () => {
    it("should format composite", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["тип1", "тип2"],
      }

      const expectedResult = "тип1, тип2"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })

    it("should format parametrical types composite", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string", "number"],
        stringQualifiers: { length: 10, allowedLength: "Variable" },
        numberQualifiers: { digits: 10, fractionDigits: 2 },
      }

      const expectedResult = "Строка(10), Число(10, 2)"

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual(expectedResult)
    })
  })

  describe("applied objects type description", () => {
    it("should format catalog", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["CatalogRef.Контрагенты"],
      }

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual("Справочник.Контрагенты")
    })

    it("should format document", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["DocumentRef.ПоступлениеТоваровНаСклад"],
      }

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual("Документ.ПоступлениеТоваровНаСклад")
    })

    it("should format enum", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["EnumRef.ТипыДокументов"],
      }

      const result = exportTypeDescriptionToEnterprise(mockTypeDescription, mockConfigurationSettings)

      expect(result).toEqual("Перечисление.ТипыДокументов")
    })
  })
})
