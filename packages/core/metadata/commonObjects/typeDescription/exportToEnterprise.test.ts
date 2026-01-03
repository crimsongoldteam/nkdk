import { describe, expect, it } from "vitest"
import {
  booleanTypeDescription,
  booleanTypeDescriptionEnterprise,
  catalogTypeDescription,
  catalogTypeDescriptionEnterprise,
  compositeParametricalTypeDescription,
  compositeParametricalTypeDescriptionEnterprise,
  compositeSimpleTypeDescription,
  compositeSimpleTypeDescriptionEnterprise,
  dateTimeTypeDescription,
  dateTimeTypeDescriptionEnterprise,
  dateTypeDescription,
  dateTypeDescriptionEnterprise,
  documentTypeDescription,
  documentTypeDescriptionEnterprise,
  enumTypeDescription,
  enumTypeDescriptionEnterprise,
  numberDecimalTypeDescription,
  numberDecimalTypeDescriptionEnterprise,
  numberNonNegativeTypeDescription,
  numberNonNegativeTypeDescriptionEnterprise,
  stringFixedTypeDescription,
  stringFixedTypeDescriptionEnterprise,
  stringUnlimitedTypeDescription,
  stringUnlimitedTypeDescriptionEnterprise,
  stringVariableTypeDescription,
  stringVariableTypeDescriptionEnterprise,
  timeTypeDescription,
  timeTypeDescriptionEnterprise,
} from "../../../tests/fixtures/typeDescription/data"
import { mockСontext } from "../../../tests/mockContext"
import { exportTypeDescriptionToEnterprise } from "./exportToEnterprise"

describe("exportTypeDescriptionToEnterprise", () => {
  it("should format undefined type description", () => {
    const result = exportTypeDescriptionToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  describe("string type description", () => {
    it("should format string", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, stringVariableTypeDescription)

      expect(result).toEqual(stringVariableTypeDescriptionEnterprise)
    })

    it("should format unlimited string", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, stringUnlimitedTypeDescription)

      expect(result).toEqual(stringUnlimitedTypeDescriptionEnterprise)
    })

    it("should format fixed string", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, stringFixedTypeDescription)

      expect(result).toEqual(stringFixedTypeDescriptionEnterprise)
    })
  })

  describe("number type description", () => {
    it("should format number", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, numberDecimalTypeDescription)

      expect(result).toEqual(numberDecimalTypeDescriptionEnterprise)
    })

    it("should format non-negative number", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, numberNonNegativeTypeDescription)

      expect(result).toEqual(numberNonNegativeTypeDescriptionEnterprise)
    })
  })

  describe("date type description", () => {
    it("should format date", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, dateTypeDescription)

      expect(result).toEqual(dateTypeDescriptionEnterprise)
    })

    it("should format time", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, timeTypeDescription)

      expect(result).toEqual(timeTypeDescriptionEnterprise)
    })

    it("should format date and time", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, dateTimeTypeDescription)

      expect(result).toEqual(dateTimeTypeDescriptionEnterprise)
    })

    it("should format date", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, dateTypeDescription)

      expect(result).toEqual(dateTypeDescriptionEnterprise)
    })
  })

  describe("boolean type description", () => {
    it("should format boolean", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, booleanTypeDescription)

      expect(result).toEqual(booleanTypeDescriptionEnterprise)
    })
  })

  describe("composite type description", () => {
    it("should format composite", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, compositeSimpleTypeDescription)

      expect(result).toEqual(compositeSimpleTypeDescriptionEnterprise)
    })

    it("should format parametrical types composite", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, compositeParametricalTypeDescription)

      expect(result).toEqual(compositeParametricalTypeDescriptionEnterprise)
    })
  })

  describe("applied objects type description", () => {
    it("should format catalog", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, catalogTypeDescription)

      expect(result).toEqual(catalogTypeDescriptionEnterprise)
    })

    it("should format document", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, documentTypeDescription)

      expect(result).toEqual(documentTypeDescriptionEnterprise)
    })

    it("should format enum", () => {
      const result = exportTypeDescriptionToEnterprise(mockСontext, enumTypeDescription)

      expect(result).toEqual(enumTypeDescriptionEnterprise)
    })
  })
})
