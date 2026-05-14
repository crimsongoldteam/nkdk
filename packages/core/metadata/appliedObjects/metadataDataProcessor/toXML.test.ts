import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "~/tests/appliedObject"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataDataProcessorRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataDataProcessor to XML", () => {
  it.each([
    { name: "full", fixture: "full.xml", data: full },
    { name: "minimal", fixture: "minimal.xml", data: minimal },
  ])("should export $name", ({ fixture, data }) => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataDataProcessorRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})

describe("export MetadataDataProcessor attributes to XML", () => {
  it("exports attribute SettingsComposer type with local dcsset namespace", () => {
    const { result } = testExportPropertyToXML({
      rule: MetadataDataProcessorRules.properties.attributes,
      value: [
        {
          uuid: "8a57d427-a34e-4121-84e6-1a86a9f9092d",
          name: "КомпоновщикОтбораВсехДокументов",
          synonym: { items: { ru: "Компоновщик отбора всех документов" } },
          type: { type: ["SettingsComposer"] },
        },
      ],
      xmlRootTag: "Attribute",
    })

    expect(result).toContain(
      '<v8:Type xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings">dcsset:SettingsComposer</v8:Type>',
    )
  })
})
