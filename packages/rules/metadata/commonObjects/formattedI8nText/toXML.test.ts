import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import {
  markYAMLMappingTag,
  markYAMLScalarTag,
  xmlAnomalyTagValue,
  xmlExport,
} from "@nkdk/runtime"
import { exportFormattedI8nTextToXML } from "./toXML"
import { FormattedI8nTextPropertyRule } from "./types"

describe("exportFormattedI8nTextToXML", () => {
  describe("exportFormattedI8nTextToXML", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextToXML(mockContext, mockRule, fixture.text)

        const xml = result ? xmlExport({ Title: result }, false) : undefined

        expect(xml).toEqual(fixture.xml)
      })
    })

    it("expands duplicate and preserves tagged order", () => {
      const items = { en: "Group", ru: xmlAnomalyTagValue("xml/duplicate", "Группа") }
      markYAMLMappingTag(items, "xml/order")
      markYAMLScalarTag(items, "ru", "xml/duplicate")

      expect(exportFormattedI8nTextToXML(mockContext, mockRule, { formatted: false, items })).toEqual({
        _formatted: false,
        "v8:item": [
          { "v8:lang": "en", "v8:content": "Group" },
          { "v8:lang": "ru", "v8:content": "Группа" },
          { "v8:lang": "ru", "v8:content": "Группа" },
        ],
      })
    })
  })
  describe("exportFormattedI8nTextToXMLWithDefaultLanguage", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const rule: FormattedI8nTextPropertyRule = {
          type: "FormattedI8nText",
          xmlWithDefaultLanguage: true,
        }
        const result = exportFormattedI8nTextToXML(mockContext, rule, fixture.text)
        const xml = result ? xmlExport({ Title: result }, false) : undefined
        expect(xml).toEqual(fixture.xml)
      })
    })
  })
})
