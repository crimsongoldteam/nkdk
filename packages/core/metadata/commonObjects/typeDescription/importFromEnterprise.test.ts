import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
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
      const result = importTypeDescriptionFromEnterprise(mockСontext, "Строка(10)")

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse unlimited string", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string"],
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "Строка")

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse fixed string", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string"],
        stringQualifiers: { length: 100, allowedLength: "Fixed" },
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "ФиксированнаяСтрока(100)")

      expect(result).toEqual(mockTypeDescription)
    })
  })

  describe("number type description", () => {
    it("should parse number", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["decimal"],
        numberQualifiers: { digits: 10, fractionDigits: 2 },
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "Число(10,2)")

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse non-negative number", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["decimal"],
        numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Nonnegative" },
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "ПоложительноеЧисло(10,2)")

      expect(result).toEqual(mockTypeDescription)
    })
  })

  describe("date type description", () => {
    it("should parse date", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["dateTime"],
        dateQualifiers: { dateFractions: "Date" },
      }

      const result = importTypeDescriptionFromEnterprise(mockСontext, "Дата")

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse time", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["dateTime"],
        dateQualifiers: { dateFractions: "Time" },
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "Время")

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse date and time", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["dateTime"],
        dateQualifiers: { dateFractions: "DateTime" },
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "ДатаВремя")

      expect(result).toEqual(mockTypeDescription)
    })
  })

  describe("boolean type description", () => {
    it("should parse boolean", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["boolean"],
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "Булево")

      expect(result).toEqual(mockTypeDescription)
    })
  })

  describe("composite type description", () => {
    it("should parse composite", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["тип1", "тип2"],
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, ["тип1", "тип2"])

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse parametrical types composite", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["string", "decimal"],
        stringQualifiers: { length: 10, allowedLength: "Variable" },
        numberQualifiers: { digits: 10, fractionDigits: 2 },
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, ["Строка(10)", "Число(10,2)"])
      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse document", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["DocumentRef.ПоступлениеТоваровНаСклад"],
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "Документ.ПоступлениеТоваровНаСклад")

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse enum", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["EnumRef.ТипыДокументов"],
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "Перечисление.ТипыДокументов")

      expect(result).toEqual(mockTypeDescription)
    })

    it("should parse defined type", () => {
      const mockTypeDescription: TypeDescription = {
        type: ["DefinedType.GTIN"],
      }
      const result = importTypeDescriptionFromEnterprise(mockСontext, "ОпределяемыйТип.GTIN")

      expect(result).toEqual(mockTypeDescription)
    })
  })
})
