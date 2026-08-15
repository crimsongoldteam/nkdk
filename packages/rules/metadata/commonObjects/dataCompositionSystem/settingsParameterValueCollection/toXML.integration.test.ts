import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testAtomicToXML } from "../../../../tests/property/atomicToXML"
import { settingsParameterValueCollectionFixture } from "./__fixtures__/data"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import { exportToYAML, importFromYAML, yamlScalarTagAt } from "@nkdk/runtime"
import type { MetadataItemRule } from "../../../ruleRuntime"

const rule: PropertyRule = {
  type: "SettingsParameterValueCollection",
  defaultItemRule: {
    type: "SettingsParameterValue",
    valueType: "Field",
  },
}

describe("export SettingsParameterValueCollection to XML", () => {
  it("сохраняет явно пустой контейнер через !xml/present", () => {
    const metadataRule = {
      itemType: "SettingsParameterValueCollectionProbe",
      properties: {
        value: { ...rule, yaml: "ПараметрыДанных", xml: "DataParameters" },
      },
    } as const satisfies MetadataItemRule

    const imported = testPropertyFromXMLToYAML({
      rule: metadataRule,
      xml: { DataParameters: {} },
    })

    expect(exportToYAML(imported.yaml)).toBe("ПараметрыДанных: !xml/present")
    expect(yamlScalarTagAt(imported.yaml, "ПараметрыДанных")).toBe("xml/present")

    const restored = testPropertyFromYAMLToXML({
      rule: metadataRule,
      yaml: importFromYAML("ПараметрыДанных: !xml/present"),
    })

    expect(restored.xml).toEqual({ DataParameters: {} })
  })

  it("различает отсутствующий и непустой контейнер", () => {
    const metadataRule = {
      itemType: "SettingsParameterValueCollectionProbe",
      properties: {
        value: { ...rule, yaml: "ПараметрыДанных", xml: "DataParameters" },
      },
    } as const satisfies MetadataItemRule

    expect(testPropertyFromYAMLToXML({ rule: metadataRule, yaml: {} }).xml).toEqual({})
    expect(testPropertyFromYAMLToXML({
      rule: metadataRule,
      yaml: { ПараметрыДанных: { Параметр1: "Значение" } },
    }).xml).toHaveProperty("DataParameters.dcscor:item")
  })

  it("exports full fixture", () => {
    const { result, expectedResult } = testAtomicToXML({
      rule,
      value: settingsParameterValueCollectionFixture,
      xmlRootTag: "dcsset:dataParameters",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports ent system enumeration values under generic Field rule", () => {
    const { result } = testAtomicToXML({
      rule,
      value: {
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
      },
      xmlRootTag: "dcsset:dataParameters",
      referenceMetadata: undefined,
    })

    expect(result).toContain('<dcscor:item xsi:type="dcsset:SettingsParameterValue">')
    expect(result).toContain("<dcscor:use>false</dcscor:use>")
    expect(result).toContain("<dcscor:parameter>ВидДвижения</dcscor:parameter>")
    expect(result).toContain('<dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>')
  })

  it("восстанавливает xsi:nil из !xml Nil без снимка и reference XML", () => {
    const metadataRule = {
      itemType: "SettingsParameterValueCollectionProbe",
      properties: {
        value: { ...rule, yaml: "Значение", xml: "DataParameters" },
      },
    } as const satisfies MetadataItemRule
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Test.Settings" })
    const imported = testPropertyFromXMLToYAML({
      rule: metadataRule,
      context: contexts.importContext,
      xml: {
        DataParameters: {
          "dcscor:item": {
            "_xsi:type": "dcsset:SettingsParameterValue",
            "dcscor:parameter": "Параметр1",
            "dcscor:value": { "_xsi:nil": true },
          },
        },
      },
    })
    const restored = testPropertyFromYAMLToXML({
      rule: metadataRule,
      yaml: imported.yaml,
    })

    expect(restored.xml).toMatchObject({
      DataParameters: {
        "dcscor:item": {
          "dcscor:parameter": "Параметр1",
          "dcscor:value": { "_xsi:nil": true },
        },
      },
    })
  })
})
