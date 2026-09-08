import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { createConfigurationLanguages } from "@nkdk/runtime"
import { parseStructuralXMLWithoutCompatibility, xmlElementFromTestValue } from "../../../tests/structuralXML"
import { importI8nTextFromXML } from "./fromXML"
import { I8nTextPropertyRule } from "./types"
import { localizedItemOccurrences } from "./anomalies"

const preserveEmptyXMLRule: I8nTextPropertyRule = {
  yaml: "Шапка",
  type: "I8nText",
  preserveEmptyXML: true,
}

const excludeEqualNameRule: I8nTextPropertyRule = {
  yaml: "Синоним",
  type: "I8nText",
  excludeIfEqualNameYAML: true,
}

const multilingualXMLContext = {
  ...mockContextFromXML(),
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en", "de"] }),
}

describe("importI8nTextFromXML", () => {
  it.each(i8nTextFixtures)("should import: $name", (fixture) => {
    const xml = fixture.xml ? parseStructuralXMLWithoutCompatibility(fixture.xml) : undefined
    const result = importI8nTextFromXML(multilingualXMLContext, mockRule, xml)
    expect(result).toEqual(fixture.text)
  })

  it("imports empty XML tag as empty text when rule opts in", () => {
    const result = importI8nTextFromXML(mockContextFromXML(), preserveEmptyXMLRule, parseStructuralXMLWithoutCompatibility("<Title/>"))

    expect(result).toEqual({ items: {} })
  })

  it("imports empty XML tag as explicit empty text for excludeIfEqualNameYAML", () => {
    const result = importI8nTextFromXML(mockContextFromXML(), excludeEqualNameRule, parseStructuralXMLWithoutCompatibility("<Synonym/>"))

    expect(result).toEqual({ items: {} })
  })

  it("сохраняет первое смысловое значение и все вхождения языков", () => {
    const result = importI8nTextFromXML(multilingualXMLContext, mockRule, xmlElementFromTestValue("Title", {
      "v8:item": [
        { "v8:lang": "ru", "v8:content": "Первый" },
        { "v8:lang": "en", "v8:content": "Text" },
        { "v8:lang": "ru", "v8:content": "Второй" },
      ],
    }))!

    expect(result.items).toEqual({ ru: "Первый", en: "Text" })
    expect(localizedItemOccurrences(result.items)).toEqual([
      { language: "ru", content: "Первый" },
      { language: "en", content: "Text" },
      { language: "ru", content: "Второй" },
    ])
  })
})
