import { describe, expect, it } from "vitest"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { xmlExport } from "@nkdk/runtime"
import { typedI8nTextRule, typedI8nTextValue } from "./__fixtures__/data"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "./toXML"
import { I8nTextPropertyRule, type I8nTextXML } from "./types"
import { markYAMLMappingTag, markYAMLScalarTag, xmlAnomalyTagValue } from "@nkdk/runtime"
import { staticPropertyTypes } from "../../composition/staticPropertyRules"

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

function expectLegacyFixture(
  name: string,
  result: I8nTextXML | undefined,
  xml: string | undefined,
  expectedXML: string | undefined,
): void {
  if (name === "only other languages (multiple languages)") {
    expect(result?.["v8:item"]).toEqual([
      { "v8:lang": "de", "v8:content": "Feld" },
      { "v8:lang": "en", "v8:content": "Field" },
    ])
  } else {
    expect(xml).toEqual(expectedXML)
  }
}

describe("exportI8nTextToXML", () => {
  describe("exportI8nTextToXML", () => {
    i8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportI8nTextToXML(mockContext, mockRule, fixture.text)

        const xml = result ? xmlExport({ Title: result }, false) : undefined

        expectLegacyFixture(fixture.name, result, xml, fixture.xml)
      })
    })

    it("does not export an empty language marker", () => {
      const result = exportI8nTextToXML(mockContext, mockRule, { items: { ru: "" } })
      const xml = result ? xmlExport({ Title: result }, false) : undefined

      expect(xml).toEqual("<Title/>")
    })

    it("exports empty text as raw XML when rule opts in", () => {
      const result = exportI8nTextToXML(mockContext, preserveEmptyXMLRule, { items: { ru: "" } })
      const xml = result ? xmlExport({ Title: result }, false) : undefined

      expect(xml).toEqual("<Title/>")
    })

    it("exports explicit empty text as raw XML for excludeIfEqualNameYAML", () => {
      const result = exportI8nTextToXML(mockContext, excludeEqualNameRule, { items: {} })
      const xml = result ? xmlExport({ Title: result }, false) : undefined

      expect(result).toEqual({})
      expect(xml).toEqual("<Title/>")
    })

    it("expands duplicate and preserves tagged order", () => {
      const items = { en: "Text", ru: xmlAnomalyTagValue("xml/duplicate", "Текст") }
      markYAMLMappingTag(items, "xml/order")
      markYAMLScalarTag(items, "ru", "xml/duplicate")

      expect(exportI8nTextToXML(mockContext, excludeEqualNameRule, { items })).toEqual({
        "v8:item": [
          { "v8:lang": "en", "v8:content": "Text" },
          { "v8:lang": "ru", "v8:content": "Текст" },
          { "v8:lang": "ru", "v8:content": "Текст" },
        ],
      })
    })
  })

  describe("exportI8nTextToXMLWithDefaultLanguage", () => {
    it.each(i8nTextFixtures)("should export: $name", (fixture) => {
      const result = exportI8nTextToXMLWithDefaultLanguage(mockContext, mockRule, fixture.text)
      const xml = result ? xmlExport({ Title: result }, false) : undefined
      expectLegacyFixture(fixture.name, result, xml, fixture.xml)
    })
  })

  describe("typedXML", () => {
    it("выгружает v8:LocalStringType с xsi:type", () => {
      expect(staticPropertyTypes.I8nText?.exportToXML).toBe(exportI8nTextToXML)
      const { result, expectedResult } = testAtomicToXML({
        rule: typedI8nTextRule,
        value: typedI8nTextValue,
        xmlRootTag: "Title",
        path: "typed.xml",
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(expectedResult)
    })
  })
})
