import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { settingsParameterValueCollectionFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "SettingsParameterValueCollection",
  defaultItemRule: {
    type: "SettingsParameterValue",
    valueType: "Field",
  },
}

describe("import SettingsParameterValueCollection from XML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:dataParameters",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(settingsParameterValueCollectionFixture)
  })

  it("imports ent system enumeration values under generic Field rule", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:dataParameters",
      xmlString: `<dcsset:dataParameters xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise/current-config">
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:use>false</dcscor:use>
    <dcscor:parameter>ВидДвижения</dcscor:parameter>
    <dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>
  </dcscor:item>
</dcsset:dataParameters>`,
    })

    expect(result).toEqual({
      itemType: "SettingsParameterValueCollection",
      parameters: {
        ВидДвижения: {
          parameter: "ВидДвижения",
          use: false,
          value: {
            type: "SystemEnumeration",
            typeSE: "AccumulationRecordType",
            value: "Receipt",
          },
        },
      },
    })
  })

  it("imports xsi:nil as the local Nil transport", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:dataParameters",
      xmlString: `<dcsset:dataParameters>
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:parameter>Параметр1</dcscor:parameter>
    <dcscor:value xsi:nil="true"/>
  </dcscor:item>
</dcsset:dataParameters>`,
    })

    expect(result).toMatchObject({ parameters: { Параметр1: { xmlNil: true } } })
  })
})
