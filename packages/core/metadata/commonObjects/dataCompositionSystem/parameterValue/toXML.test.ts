import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import {
  fixtureFormatLocalString,
  nilSettingsParameterValue,
  nilSettingsParameterValueRule,
  parameterValueFixtures,
  xmlNilSettingsParameterValue,
} from "./__fixtures__/data"

describe("exportParameterValueToDcsXML", () => {
  it.each(parameterValueFixtures)("exports $title", (fixture) => {
    const { result } = testExportPropertyToXML({
      rule: fixture.rule,
      value: fixture.value,
      xmlRootTag: "dcscor:item",
    })

    expect(result).toEqual(fixture.xml)
  })

  it("restores nil value from reference when current value is absent", () => {
    const reference = testImportPropertyFromXML({
      rule: nilSettingsParameterValueRule,
      xmlRootTag: "dcscor:item",
      xmlString: xmlNilSettingsParameterValue,
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule: nilSettingsParameterValueRule,
      value: nilSettingsParameterValue,
      xmlRootTag: "dcscor:item",
      referenceMetadata: reference,
    })

    expect(result).toEqual(xmlNilSettingsParameterValue)
  })

  it("exports explicit value instead of reference nil", () => {
    const reference = testImportPropertyFromXML({
      rule: nilSettingsParameterValueRule,
      xmlRootTag: "dcscor:item",
      xmlString: xmlNilSettingsParameterValue,
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule: nilSettingsParameterValueRule,
      value: {
        ...nilSettingsParameterValue,
        value: fixtureFormatLocalString,
      },
      xmlRootTag: "dcscor:item",
      referenceMetadata: reference,
    })

    expect(result).toContain('<dcscor:value xsi:type="v8:LocalStringType">')
    expect(result).not.toContain('xsi:nil="true"')
  })

  it("restores empty LocalStringType from reference when current value is absent", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue" },
      value: {
        parameter: "Текст",
        use: false,
      },
      xmlRootTag: "dcscor:item",
      referenceMetadata: {
        parameter: "Текст",
        use: false,
        value: { items: {} },
      },
    })

    expect(result).toContain('<dcscor:value xsi:type="v8:LocalStringType"/>')
  })
})
