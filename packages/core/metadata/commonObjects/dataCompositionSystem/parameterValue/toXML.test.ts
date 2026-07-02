import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
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

  it("exports explicit empty xs:string instead of dcscor:Field", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "SettingsParameterValue", valueType: "Field" } as PropertyRule,
      value: {
        parameter: "НоменклатураВключение",
        use: false,
        value: { type: "string", value: "" },
      },
      xmlRootTag: "dcscor:item",
    })

    expect(result).toContain('<dcscor:value xsi:type="xs:string"/>')
    expect(result).not.toContain('xsi:type="dcscor:Field"')
  })

  it("preserves userSettingPresentation xs:string from unchanged reference", () => {
    const reference = testImportPropertyFromXML({
      rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Период" },
      xmlRootTag: "dcscor:item",
      xmlString: `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>Период</dcscor:parameter>
	<dcsset:userSettingPresentation xsi:type="xs:string">по</dcsset:userSettingPresentation>
</dcscor:item>`,
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Период" },
      value: {
        parameter: "Период",
        userSettingPresentation: { items: { ru: "по" } },
      },
      xmlRootTag: "dcscor:item",
      referenceMetadata: reference,
    })

    expect(result).toContain('<dcsset:userSettingPresentation xsi:type="xs:string">по</dcsset:userSettingPresentation>')
  })

  it("exports changed single-language userSettingPresentation as xs:string", () => {
    const reference = testImportPropertyFromXML({
      rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Период" },
      xmlRootTag: "dcscor:item",
      xmlString: `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>Период</dcscor:parameter>
	<dcsset:userSettingPresentation xsi:type="xs:string">по</dcsset:userSettingPresentation>
</dcscor:item>`,
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Период" },
      value: {
        parameter: "Период",
        userSettingPresentation: { items: { ru: "после" } },
      },
      xmlRootTag: "dcscor:item",
      referenceMetadata: reference,
    })

    expect(result).toContain(
      '<dcsset:userSettingPresentation xsi:type="xs:string">после</dcsset:userSettingPresentation>'
    )
    expect(result).not.toContain("<v8:item>")
  })
})
