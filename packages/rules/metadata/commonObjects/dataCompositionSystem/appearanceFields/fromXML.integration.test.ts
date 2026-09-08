import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { fixtureAppearanceFields } from "./__fixtures__/data"
import "./types"
import { metadataPropertyRule000 } from "./fromXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readXMLFixtureAsString } from "../../../../tests/readFixtureXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"

const rule: PropertyRule = {
  type: "AppearanceFields",
}

describe("import Appearance from XML", () => {
  it("imports structural appearance without intermediate XML", () => {
    const source = parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, "appearance.xml"))
    expect(metadataPropertyRule000.handler(mockContextFromXML(), rule, source)).toEqual(fixtureAppearanceFields)
  })

  it("preserves structural nil for a string appearance parameter", () => {
    const source = parseStructuralXMLWithoutCompatibility('<appearance><dcscor:item><dcscor:parameter>Текст</dcscor:parameter><dcscor:value xsi:nil="true"/></dcscor:item></appearance>')
    expect(metadataPropertyRule000.handler(mockContextFromXML(), rule, source)).toMatchObject({ Текст: { value: null } })
  })

  it("should import appearance.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "appearance.xml",
      xmlRootTag: "dcsset:appearance",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fixtureAppearanceFields)
  })

  it("imports DCS auto text color as present parameter without value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:appearance",
      xmlString: `
<dcsset:appearance xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:parameter>ЦветТекста</dcscor:parameter>
    <dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>
  </dcscor:item>
</dcsset:appearance>`,
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
      },
    })
  })

  it("imports disabled DCS auto background color without value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:appearance",
      xmlString: `
<dcsset:appearance xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:use>false</dcscor:use>
    <dcscor:parameter>ЦветФона</dcscor:parameter>
    <dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>
  </dcscor:item>
</dcsset:appearance>`,
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветФона: {
        parameter: "ЦветФона",
        use: false,
      },
    })
  })
})
