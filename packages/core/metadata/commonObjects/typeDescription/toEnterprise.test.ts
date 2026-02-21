import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportTypeDescriptionToEnterprise } from "./toEnterprise"
import { TypeDescription } from "./types"

describe("exportTypeDescriptionToPreview", () => {
  it("should return undefined when typeDescription is undefined", () => {
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return single string for single type without ignoreInPreview", () => {
    const typeDescription: TypeDescription = {
      type: ["string"],
    }
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, typeDescription)
    expect(result).toEqual({ Type: ["string"] })
  })

  it("should return single string for multiple primitive types", () => {
    const typeDescription: TypeDescription = {
      type: ["string", "decimal", "boolean", "dateTime"],
    }
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, typeDescription)
    expect(result).toEqual({ Type: ["string", "decimal", "boolean", "dateTime"] })
  })

  it("should return undefined for complex types full of ignored types", () => {
    const typeDescription: TypeDescription = {
      type: ["CatalogRef", "DocumentRef"],
    }
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, typeDescription)
    expect(result).toBeUndefined()
  })

  it("should return non-ignored types only when mixed with ignored types", () => {
    const typeDescription: TypeDescription = {
      type: ["CatalogRef", "string"],
    }
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, typeDescription)
    expect(result).toEqual({ Type: ["string"] })
  })

  it("should include stringQualifiers in result", () => {
    const typeDescription: TypeDescription = {
      type: ["string"],
      stringQualifiers: {
        length: 100,
        allowedLength: "Variable",
      },
    }
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, typeDescription)
    expect(result).toEqual({
      Type: ["string"],
      StringQualifiers: {
        Length: 100,
        AllowedLength: "Variable",
      },
    })
  })

  it("should include numberQualifiers in result", () => {
    const typeDescription: TypeDescription = {
      type: ["decimal"],
      numberQualifiers: {
        digits: 10,
        fractionDigits: 2,
        allowedSign: "Any",
      },
    }
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, typeDescription)
    expect(result).toEqual({
      Type: ["decimal"],
      NumberQualifiers: {
        Digits: 10,
        FractionDigits: 2,
        AllowedSign: "Any",
      },
    })
  })

  it("should include dateQualifiers in result", () => {
    const typeDescription: TypeDescription = {
      type: ["date"],
      dateQualifiers: {
        dateFractions: "Date",
      },
    }
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, typeDescription)
    expect(result).toEqual({
      Type: ["date"],
      DateQualifiers: {
        DateFractions: "Date",
      },
    })
  })

  it("should include all qualifiers when present", () => {
    const typeDescription: TypeDescription = {
      type: ["string", "decimal", "date"],
      stringQualifiers: {
        length: 50,
        allowedLength: "Fixed",
      },
      numberQualifiers: {
        digits: 15,
        fractionDigits: 4,
        allowedSign: "Nonnegative",
      },
      dateQualifiers: {
        dateFractions: "DateTime",
      },
    }
    const result = exportTypeDescriptionToEnterprise(mockContext, mockRule, typeDescription)
    expect(result).toEqual({
      Type: ["string", "decimal", "date"],
      StringQualifiers: {
        Length: 50,
        AllowedLength: "Fixed",
      },
      NumberQualifiers: {
        Digits: 15,
        FractionDigits: 4,
        AllowedSign: "Nonnegative",
      },
      DateQualifiers: {
        DateFractions: "DateTime",
      },
    })
  })
})
