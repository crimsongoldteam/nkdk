import { describe, expect, it } from "vitest"
import { canConvertToPascalCase } from "./canConvertToPascalCase"

describe("canConvertToPascalCase", () => {
  describe("Latin characters", () => {
    it("should return true when single word matches PascalCase", () => {
      expect(canConvertToPascalCase("Test", "Test")).toBeTruthy()
    })

    it("should return true when words with lowercase letters convert to PascalCase", () => {
      expect(canConvertToPascalCase("Test test", "TestTest")).toBeTruthy()
    })

    it("should return false when words start with capital letters after space", () => {
      expect(canConvertToPascalCase("Test Test", "TestTest")).toBeFalsy()
    })

    it("should return true when abbreviation matches PascalCase", () => {
      expect(canConvertToPascalCase("USSR", "USSR")).toBeTruthy()
    })

    it("should return true when abbreviation with lowercase words converts to PascalCase", () => {
      expect(canConvertToPascalCase("Back in USSR", "BackInUSSR")).toBeTruthy()
    })

    it("should return true when string is already in PascalCase", () => {
      expect(canConvertToPascalCase("TestTest", "TestTest")).toBeFalsy()
    })
  })

  describe("Cyrillic characters", () => {
    it("should return true when single word matches PascalCase", () => {
      expect(canConvertToPascalCase("Тест", "Тест")).toBeTruthy()
    })

    it("should return true when words with lowercase letters convert to PascalCase", () => {
      expect(canConvertToPascalCase("Тест тест", "ТестТест")).toBeTruthy()
    })

    it("should return false when words start with capital letters after space", () => {
      expect(canConvertToPascalCase("Тест Тест", "ТестТест")).toBeFalsy()
    })

    it("should return true when abbreviation matches PascalCase", () => {
      expect(canConvertToPascalCase("СССР", "СССР")).toBeTruthy()
    })

    it("should return false when have one word with uppercase letter", () => {
      expect(canConvertToPascalCase("Назад в СССР", "НазадВСССР")).toBeFalsy()
    })

    it("should return false when have one word with uppercase letter", () => {
      expect(canConvertToPascalCase("Назад В СССР", "НазадВСССР")).toBeFalsy()
    })

    it("should return true when string is already in PascalCase", () => {
      expect(canConvertToPascalCase("ТестТест", "ТестТест")).toBeFalsy()
    })

    it("should return false when string contains multiple spaces", () => {
      expect(canConvertToPascalCase("Тест  тест", "ТестТест")).toBeFalsy()
    })

    it("should return true when have abbreviation", () => {
      expect(canConvertToPascalCase("История КПП", "ИсторияКПП")).toBeTruthy()
    })
  })
})
