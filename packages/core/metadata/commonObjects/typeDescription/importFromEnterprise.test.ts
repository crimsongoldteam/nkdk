import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { exportTypeDescriptionToEnterprise } from "./exportToEnterprise"
import { importTypeDescriptionFromEnterprise } from "./importFromEnterprise"
import { TypeDescription } from "./types"

describe("importTypeDescriptionFromEnterprise", () => {
  it("should parse undefined type description", () => {
    const result = importTypeDescriptionFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should parse empty string as undefined", () => {
    const result = importTypeDescriptionFromEnterprise(mockСontext, "")
    expect(result).toBeUndefined()
  })

  it("should parse whitespace string as undefined", () => {
    const result = importTypeDescriptionFromEnterprise(mockСontext, "   ")
    expect(result).toBeUndefined()
  })

  describe("string type description", () => {
    it("should parse string", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string"],
        stringQualifiers: { length: 10, allowedLength: "Variable" },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse unlimited string", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string"],
        stringQualifiers: { length: 0, allowedLength: "Variable" },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse fixed string", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string"],
        stringQualifiers: { length: 100, allowedLength: "Fixed" },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual(mockTypeDescription)
    })
  })

  describe("number type description", () => {
    it("should parse number", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["decimal"],
        numberQualifiers: { digits: 10, fractionDigits: 2 },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["number"],
        numberQualifiers: { digits: 10, fractionDigits: 2 },
      })
    })

    it("should parse non-negative number", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["decimal"],
        numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Nonnegative" },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["number"],
        numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Nonnegative" },
      })
    })
  })

  describe("date type description", () => {
    it("should parse date", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["dateTime"],
        dateQualifiers: { dateFractions: "Date" },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["date"],
        dateQualifiers: { dateFractions: "Date" },
      })
    })

    it("should parse time", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["dateTime"],
        dateQualifiers: { dateFractions: "Time" },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["date"],
        dateQualifiers: { dateFractions: "Time" },
      })
    })

    it("should parse date and time", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["dateTime"],
        dateQualifiers: { dateFractions: "DateTime" },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["date"],
        dateQualifiers: { dateFractions: "DateTime" },
      })
    })
  })

  describe("boolean type description", () => {
    it("should parse boolean", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["boolean"],
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["Булево"],
      })
    })
  })

  describe("composite type description", () => {
    it("should parse composite", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["тип1", "тип2"],
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse parametrical types composite", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string", "decimal"],
        stringQualifiers: { length: 10, allowedLength: "Variable" },
        numberQualifiers: { digits: 10, fractionDigits: 2 },
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["string", "number"],
        stringQualifiers: { length: 10, allowedLength: "Variable" },
        numberQualifiers: { digits: 10, fractionDigits: 2 },
      })
    })
  })

  describe("applied objects type description", () => {
    it("should parse catalog", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["CatalogRef.Контрагенты"],
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["Справочник.Контрагенты"],
      })
    })

    it("should parse document", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["DocumentRef.ПоступлениеТоваровНаСклад"],
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["Документ.ПоступлениеТоваровНаСклад"],
      })
    })

    it("should parse enum", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["EnumRef.ТипыДокументов"],
      }
      const enterpriseString = exportTypeDescriptionToEnterprise(mockСontext, mockTypeDescription)

      const result = importTypeDescriptionFromEnterprise(mockСontext, enterpriseString!)

      expect(result).toEqual({
        type: ["Перечисление.ТипыДокументов"],
      })
    })
  })
})
