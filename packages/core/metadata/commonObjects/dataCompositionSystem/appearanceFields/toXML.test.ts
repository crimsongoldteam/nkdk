import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fixtureAppearanceFields, fixtureAppearanceRule } from "./__fixtures__/data"

describe("export Appearance to XML", () => {
  it("should export appearance.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule: fixtureAppearanceRule,
      value: fixtureAppearanceFields,
      xmlRootTag: "dcsset:appearance",
      path: "appearance.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("restores XML auto value for enabled DCS color without YAML value", () => {
    const { result } = testExportPropertyToXML({
      rule: fixtureAppearanceRule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
        },
      },
      xmlRootTag: "dcsset:appearance",
    })

    expect(result).toContain("<dcscor:parameter>ЦветТекста</dcscor:parameter>")
    expect(result).toContain('<dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>')
  })

  it("restores XML auto value for disabled DCS color without YAML value", () => {
    const { result } = testExportPropertyToXML({
      rule: fixtureAppearanceRule,
      value: {
        itemType: "AppearanceFields",
        ЦветФона: {
          parameter: "ЦветФона",
          use: false,
        },
      },
      xmlRootTag: "dcsset:appearance",
    })

    expect(result).toContain("<dcscor:use>false</dcscor:use>")
    expect(result).toContain("<dcscor:parameter>ЦветФона</dcscor:parameter>")
    expect(result).toContain('<dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>')
  })
})
