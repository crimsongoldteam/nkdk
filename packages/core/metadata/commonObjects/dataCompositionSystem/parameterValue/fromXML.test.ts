import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import {
  nilSettingsParameterValue,
  nilSettingsParameterValueRule,
  parameterValueFixtures,
  xmlNilSettingsParameterValue,
} from "./__fixtures__/data"

describe("importParameterValueFromXML", () => {
  it.each(parameterValueFixtures)("imports $title", (fixture) => {
    expect(
      testImportPropertyFromXML({
        rule: fixture.rule,
        xmlRootTag: "dcscor:item",
        xmlString: fixture.xml!,
      })
    ).toEqual(fixture.value)
  })

  it("imports nil SettingsParameterValue without public value", () => {
    expect(
      testImportPropertyFromXML({
        rule: nilSettingsParameterValueRule,
        xmlRootTag: "dcscor:item",
        xmlString: xmlNilSettingsParameterValue,
      })
    ).toEqual(nilSettingsParameterValue)
  })

  it("keeps nil marker only for reference import", () => {
    expect(
      testImportPropertyFromXML({
        rule: nilSettingsParameterValueRule,
        xmlRootTag: "dcscor:item",
        xmlString: xmlNilSettingsParameterValue,
        forReference: true,
      })
    ).toEqual({
      ...nilSettingsParameterValue,
      __referenceNilValue: true,
    })
  })

  it("imports userSettingPresentation xs:string as I8nText", () => {
    expect(
      testImportPropertyFromXML({
        rule: { type: "SettingsParameterValue", valueType: "string", yaml: "Период" },
        xmlRootTag: "dcscor:item",
        xmlString: `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>Период</dcscor:parameter>
	<dcsset:userSettingPresentation xsi:type="xs:string">Период с</dcsset:userSettingPresentation>
</dcscor:item>`,
      })
    ).toEqual({
      parameter: "Период",
      userSettingPresentation: { items: { ru: "Период с" } },
    })
  })
})
