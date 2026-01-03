import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import {
  booleanTypeDescription,
  booleanTypeDescriptionEnterprise,
  compositeParametricalTypeDescription,
  compositeParametricalTypeDescriptionEnterpriseForImport,
  compositeSimpleTypeDescription,
  compositeSimpleTypeDescriptionEnterprise,
  dateTimeTypeDescription,
  dateTimeTypeDescriptionEnterprise,
  dateTypeDescription,
  dateTypeDescriptionEnterprise,
  definedTypeDescription,
  definedTypeDescriptionEnterprise,
  documentTypeDescription,
  documentTypeDescriptionEnterprise,
  enumTypeDescription,
  enumTypeDescriptionEnterprise,
  numberDecimalTypeDescription,
  numberDecimalTypeDescriptionEnterpriseForImport,
  numberDecimalTypeDescriptionWithoutQualifiers,
  numberDecimalTypeDescriptionWithoutQualifiersEnterprise,
  numberNonNegativeTypeDescription,
  numberNonNegativeTypeDescriptionEnterpriseForImport,
  stringFixedTypeDescription,
  stringFixedTypeDescriptionEnterprise,
  stringUnlimitedTypeDescriptionWithoutQualifiers,
  stringUnlimitedTypeDescriptionWithoutQualifiersEnterprise,
  stringVariableTypeDescription,
  stringVariableTypeDescriptionEnterprise,
  timeTypeDescription,
  timeTypeDescriptionEnterprise,
  valueStorageTypeDescription,
  valueStorageTypeDescriptionEnterprise,
} from "../../../tests/fixtures/typeDescription/data"
import { importTypeDescriptionFromEnterprise } from "./importFromEnterprise"

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
      const result = importTypeDescriptionFromEnterprise(mockСontext, stringVariableTypeDescriptionEnterprise)

      expect(result).toEqual(stringVariableTypeDescription)
    })

    it("should parse unlimited string", () => {
      const result = importTypeDescriptionFromEnterprise(
        mockСontext,
        stringUnlimitedTypeDescriptionWithoutQualifiersEnterprise
      )

      expect(result).toEqual(stringUnlimitedTypeDescriptionWithoutQualifiers)
    })

    it("should parse fixed string", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, stringFixedTypeDescriptionEnterprise)

      expect(result).toEqual(stringFixedTypeDescription)
    })
  })

  describe("number type description", () => {
    it("should parse number", () => {
      const result = importTypeDescriptionFromEnterprise(
        mockСontext,
        numberDecimalTypeDescriptionWithoutQualifiersEnterprise
      )

      expect(result).toEqual(numberDecimalTypeDescriptionWithoutQualifiers)
    })
    it("should parse number with digits and fraction digits", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, numberDecimalTypeDescriptionEnterpriseForImport)

      expect(result).toEqual(numberDecimalTypeDescription)
    })

    it("should parse non-negative number", () => {
      const result = importTypeDescriptionFromEnterprise(
        mockСontext,
        numberNonNegativeTypeDescriptionEnterpriseForImport
      )

      expect(result).toEqual(numberNonNegativeTypeDescription)
    })
  })

  describe("date type description", () => {
    it("should parse date", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, dateTypeDescriptionEnterprise)

      expect(result).toEqual(dateTypeDescription)
    })

    it("should parse time", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, timeTypeDescriptionEnterprise)

      expect(result).toEqual(timeTypeDescription)
    })

    it("should parse date and time", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, dateTimeTypeDescriptionEnterprise)

      expect(result).toEqual(dateTimeTypeDescription)
    })
  })

  describe("boolean type description", () => {
    it("should parse boolean", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, booleanTypeDescriptionEnterprise)

      expect(result).toEqual(booleanTypeDescription)
    })
  })

  describe("composite type description", () => {
    it("should parse composite", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, compositeSimpleTypeDescriptionEnterprise)

      expect(result).toEqual(compositeSimpleTypeDescription)
    })

    it("should parse parametrical types composite", () => {
      const result = importTypeDescriptionFromEnterprise(
        mockСontext,
        compositeParametricalTypeDescriptionEnterpriseForImport
      )
      expect(result).toEqual(compositeParametricalTypeDescription)
    })

    it("should parse document", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, documentTypeDescriptionEnterprise)

      expect(result).toEqual(documentTypeDescription)
    })

    it("should parse enum", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, enumTypeDescriptionEnterprise)

      expect(result).toEqual(enumTypeDescription)
    })

    it("should parse defined type", () => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, definedTypeDescriptionEnterprise)

      expect(result).toEqual(definedTypeDescription)
    })
  })
})

describe("value storage type description", () => {
  it("should parse value storage", () => {
    const result = importTypeDescriptionFromEnterprise(mockСontext, valueStorageTypeDescriptionEnterprise)

    expect(result).toEqual(valueStorageTypeDescription)
  })
})
