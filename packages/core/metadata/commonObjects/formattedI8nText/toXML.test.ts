import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/metadata/commonObjects/formattedI8nText/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
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
  })
  describe("exportFormattedI8nTextToXMLWithDefaultLanguage", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const rule: FormattedI8nTextPropertyRule = {
          type: "FormattedI8nText",
          yamlFormatted: "ФорматированныйЗаголовок",
          xmlWithDefaultLanguage: true,
        }
        const result = exportFormattedI8nTextToXML(mockContext, rule, fixture.text)
        const xml = result ? xmlExport({ Title: result }, false) : undefined
        expect(xml).toEqual(fixture.xml)
      })
    })
  })
})
