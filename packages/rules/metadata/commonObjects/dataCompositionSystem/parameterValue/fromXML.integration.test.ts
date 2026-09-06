import { describe, expect, it } from "vitest"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
import { testAtomicFromYAML } from "../../../../tests/property/atomicFromYAML"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { exportToYAML } from "@nkdk/runtime"
import { importFromYAML } from "@nkdk/runtime"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { importParameterValueFromDcsXML } from "./fromXML"
import {
  nilSettingsParameterValue,
  nilSettingsParameterValueRule,
  parameterValueFixtures,
  xmlNilSettingsParameterValue,
} from "./__fixtures__/data"

describe("importParameterValueFromXML", () => {
  it("reads structural settings fields and a short presentation", () => {
    const source = parseStructuralXMLWithoutCompatibility('<dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:parameter>Период</dcscor:parameter><dcsset:viewMode>Normal</dcsset:viewMode><dcsset:userSettingID>id</dcsset:userSettingID><dcsset:userSettingPresentation xsi:type="xs:string">Период с</dcsset:userSettingPresentation></dcscor:item>')
    expect(importParameterValueFromDcsXML(mockContextFromXML(), { type: "SettingsParameterValue", valueType: "Primitive" }, source)).toEqual({
      parameter: "Период", viewMode: "Normal", userSettingID: "id", userSettingPresentation: { items: { ru: "Период с" } },
    })
  })

  it.each(parameterValueFixtures)("imports structural $title", (fixture) => {
    const source = parseStructuralXMLWithoutCompatibility(fixture.xml!)
    expect(importParameterValueFromDcsXML(mockContextFromXML(), fixture.rule, source)).toEqual(fixture.value)
  })

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
        rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Период" },
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

  it("imports empty xs:string value as explicit empty string", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Field", yaml: "НоменклатураВключение" } as PropertyRule

    const imported = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcscor:item",
      xmlString: `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>НоменклатураВключение</dcscor:parameter>
	<dcscor:value xsi:type="xs:string"/>
</dcscor:item>`,
    })

    expect(imported).toEqual({
      parameter: "НоменклатураВключение",
      use: false,
      value: { type: "string", value: "" },
    })

    const yamlObject = testExportPropertyToYAML({
      rule,
      value: imported,
    }) as { НоменклатураВключение?: unknown }
    const yamlText = exportToYAML(yamlObject)
    const reparsedYaml = importFromYAML<Record<string, unknown>>(yamlText)
    const importedFromYaml = testAtomicFromYAML({
      rule,
      value: reparsedYaml?.НоменклатураВключение,
    })

    expect(yamlObject).toEqual({
      НоменклатураВключение: {
        Использовать: "Ложь",
        Тип: "Строка",
        Значение: "",
      },
    })
    expect(importedFromYaml).toEqual(imported)
  })

  it("keeps missing dcscor:value as missing value", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Field", yaml: "НоменклатураВключение" } as PropertyRule

    const imported = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcscor:item",
      xmlString: `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>НоменклатураВключение</dcscor:parameter>
</dcscor:item>`,
    })

    expect(imported).toEqual({
      parameter: "НоменклатураВключение",
      use: false,
    })
    expect(Object.prototype.hasOwnProperty.call(imported, "value")).toBe(false)
  })
})
