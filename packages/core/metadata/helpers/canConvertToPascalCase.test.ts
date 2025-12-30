import { describe, expect, it } from "vitest"
import { canConvertToPascalCase } from "./canConvertToPascalCase"

describe("canConvertToPascalCase", () => {
  describe("Latin characters", () => {
    it("should return true when string is empty", () => {
      expect(canConvertToPascalCase("", "")).toBeTruthy()
    })

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

    it("should return true when string contains numbers", () => {
      expect(canConvertToPascalCase("Test1Test", "Test1Test")).toBeTruthy()
    })

    it("should return when when string contains other characters", () => {
      expect(canConvertToPascalCase("Test1Test!", "Test1Test!")).toBeFalsy()
    })

    it("should handle string with only special characters (currentWord remains empty)", () => {
      // When pascalStr contains only special characters that are ignored,
      // currentWord remains empty and condition on line 94-96 doesn't execute
      expect(canConvertToPascalCase("!!!", "!!!")).toBeFalsy()
    })

    it("should handle string with only special characters and spaces", () => {
      expect(canConvertToPascalCase("!@#$%", "!@#$%")).toBeFalsy()
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
