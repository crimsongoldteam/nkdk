import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { addDefaultLanguageNameToSynonym, extractDifferentSynonymPart } from "./synonymHelpers"

describe("extractDifferentSynonymParts", () => {
  it("should return undefined when synonym is equal to name", () => {
    const result = extractDifferentSynonymPart(mockContext, { items: { ru: "Тестовый реквизит" } }, "ТестовыйРеквизит")
    expect(result).toBeUndefined()
  })

  it("should return synonym part when synonym is not equal to name in different language", () => {
    const result = extractDifferentSynonymPart(mockContext, { items: { ru: "Другой реквизит" } }, "ТестовыйРеквизит")
    expect(result).toEqual({ items: { ru: "Другой реквизит" } })
  })

  it("should extract only default language synonym part", () => {
    const result = extractDifferentSynonymPart(
      mockContext,
      { items: { ru: "Тестовый реквизит", en: "Тестовый реквизит" } },
      "ТестовыйРеквизит"
    )
    expect(result).toEqual({ items: { en: "Тестовый реквизит" } })
  })

  it("should return synonym part when synonym is not equal to name in same language", () => {
    const result = extractDifferentSynonymPart(
      mockContext,
      { items: { ru: "Тестовый реквизит", en: "Test attribute" } },
      "ТестовыйРеквизит"
    )
    expect(result).toEqual({ items: { en: "Test attribute" } })
  })
})

describe("addDefaultLanguageNameToSynonym", () => {
  it("should add default language to single language synonym", () => {
    const result = addDefaultLanguageNameToSynonym(mockContext, undefined, "ТестовыйРеквизит")
    expect(result).toEqual({ items: { ru: "Тестовый реквизит" } })
  })

  it("should add default language to multilanguage synonym", () => {
    const result = addDefaultLanguageNameToSynonym(mockContext, { items: { en: "Test attribute" } }, "ТестовыйРеквизит")
    expect(result).toEqual({ items: { ru: "Тестовый реквизит", en: "Test attribute" } })
  })

  it("should not replace existing synonym", () => {
    const result = addDefaultLanguageNameToSynonym(mockContext, { items: { ru: "Тестовый реквизит" } }, "ИмяРеквизита")
    expect(result).toEqual({ items: { ru: "Тестовый реквизит" } })
  })
})
