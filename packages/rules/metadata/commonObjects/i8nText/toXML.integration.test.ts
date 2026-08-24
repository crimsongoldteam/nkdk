import { xmlExport } from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { mockContext,mockRule } from "../../../tests/mockContext"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { staticPropertyTypes } from "../../composition/staticPropertyRules"
import { typedI8nTextRule,typedI8nTextValue } from "./__fixtures__/data"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { exportI8nTextToXML,exportI8nTextToXMLWithDefaultLanguage } from "./toXML"
import { I8nTextPropertyRule,type I8nTextXML } from "./types"

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
      { "v8:lang": "en", "v8:content": "Field" },
      { "v8:lang": "de", "v8:content": "Feld" },
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

    it("does not export an empty default-language marker for a foldable property", () => {
      const result = exportI8nTextToXML(mockContext, excludeEqualNameRule, { items: { ru: "" } })
      const xml = result ? xmlExport({ Title: result }, false) : undefined

      expect(xml).toEqual("<Title/>")
    })

    it("exports an explicit empty translation for a non-foldable property", () => {
      const result = exportI8nTextToXML(mockContext, mockRule, { items: { ru: "" } })

      expect(result).toEqual({
        "v8:item": [{ "v8:lang": "ru", "v8:content": "" }],
      })
    })

    it("exports explicit empty text as raw XML for excludeIfEqualNameYAML", () => {
      const result = exportI8nTextToXML(mockContext, excludeEqualNameRule, { items: {} })
      const xml = result ? xmlExport({ Title: result }, false) : undefined

      expect(result).toEqual({})
      expect(xml).toEqual("<Title/>")
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
