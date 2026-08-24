import { describe,expect,it } from "vitest"

import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import {
readAppliedObjectFixture,
testPropertyFromXMLToYAML
} from "../../../tests/directConversion"
import { multipleCharacteristicsYAML,singleCharacteristicYAML } from "./__fixtures__/data"

import "../metadataValue/fromXML"
import "../metadataValue/toYAML"
import "./registerCollectionRule"

const rule = {
  itemType: "CharacteristicsDescriptionProbe",
  properties: {
    value: { type: "CharacteristicsDescriptions", yaml: "Характеристики", xml: "Characteristics" },
  },
} as MetadataItemRule

describe("CharacteristicsDescriptions XML → YAML", () => {
  it.each([
    ["single", "single.xml", singleCharacteristicYAML],
    ["multiple", "multiple.xml", multipleCharacteristicsYAML],
  ])("round-trip: %s (direct XML → YAML)", (_name, fixture, expected) => {
    const xml = readAppliedObjectFixture(import.meta.url, fixture)
    const result = testPropertyFromXMLToYAML({ rule, xml })

    expect(result.yaml).toEqual({ Характеристики: expected })
  })

  it("exports undefined", () => {
    expect(testPropertyFromXMLToYAML({ rule, xml: {} }).yaml).toEqual({})
  })

  it("exports empty array", () => {
    expect(testPropertyFromXMLToYAML({ rule, xml: { Characteristics: {} } }).yaml).toEqual({})
  })

  it("exports single characteristic", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "single.xml")
    expect(testPropertyFromXMLToYAML({ rule, xml }).yaml).toEqual({ Характеристики: singleCharacteristicYAML })
  })

  it("exports multiple characteristics", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "multiple.xml")
    expect(testPropertyFromXMLToYAML({ rule, xml }).yaml).toEqual({ Характеристики: multipleCharacteristicsYAML })
  })

  it("preserves a negative service field value", () => {
    const yaml = testPropertyFromXMLToYAML({
      rule,
      xml: characteristicXML({ dataPathField: "-8" }),
    }).yaml

    expect(yaml).toMatchObject({ Характеристики: [{ ПолеПутиКДанным: "-8" }] })
  })
})

function characteristicXML(fields: {
  dataPathField?: string
  multipleValuesUseField?: string
  multipleValuesKeyField?: string
  multipleValuesOrderField?: string
}): Record<string, unknown> {
  return {
    Characteristics: {
      "xr:Characteristic": {
        "xr:CharacteristicTypes": {
          ...(fields.dataPathField === undefined ? {} : { "xr:DataPathField": fields.dataPathField }),
          ...(fields.multipleValuesUseField === undefined
            ? {}
            : { "xr:MultipleValuesUseField": fields.multipleValuesUseField }),
        },
        "xr:CharacteristicValues": {
          ...(fields.multipleValuesKeyField === undefined
            ? {}
            : { "xr:MultipleValuesKeyField": fields.multipleValuesKeyField }),
          ...(fields.multipleValuesOrderField === undefined
            ? {}
            : { "xr:MultipleValuesOrderField": fields.multipleValuesOrderField }),
        },
      },
    },
  }
}
