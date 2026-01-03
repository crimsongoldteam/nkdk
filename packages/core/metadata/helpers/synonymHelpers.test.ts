import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { addDefaultLanguageNameToSynonym, extractDifferentSynonymPart } from "./synonymHelpers"

describe("extractDifferentSynonymParts", () => {
  it("should return undefined when synonym is equal to name", () => {
    const result = extractDifferentSynonymPart(mockСontext, { items: { ru: "Тестовый реквизит" } }, "ТестовыйРеквизит")
    expect(result).toBeUndefined()
  })

  it("should return synonym part when synonym is not equal to name in different language", () => {
    const result = extractDifferentSynonymPart(mockСontext, { items: { ru: "Другой реквизит" } }, "ТестовыйРеквизит")
    expect(result).toEqual({ items: { ru: "Другой реквизит" } })
  })

  it("should return synonym part when synonym is not equal to name in same language", () => {
    const result = extractDifferentSynonymPart(
      mockСontext,
      { items: { ru: "Тестовый реквизит", en: "Test attribute" } },
      "ТестовыйРеквизит"
    )
    expect(result).toEqual({ items: { en: "Test attribute" } })
  })
})

describe("addDefaultLanguageNameToSynonym", () => {
  it("should add default language to single language synonym", () => {
    const result = addDefaultLanguageNameToSynonym(mockСontext, undefined, "ТестовыйРеквизит")
    expect(result).toEqual({ items: { ru: "Тестовый реквизит" } })
  })

  it("should add default language to multilanguage synonym", () => {
    const result = addDefaultLanguageNameToSynonym(mockСontext, { items: { en: "Test attribute" } }, "ТестовыйРеквизит")
    expect(result).toEqual({ items: { ru: "Тестовый реквизит", en: "Test attribute" } })
  })

  it("should not replace existing synonym", () => {
    const result = addDefaultLanguageNameToSynonym(mockСontext, { items: { ru: "Тестовый реквизит" } }, "ИмяРеквизита")
    expect(result).toEqual({ items: { ru: "Тестовый реквизит" } })
  })
})
