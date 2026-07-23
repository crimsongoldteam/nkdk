import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { multipleCharacteristicsYAML, singleCharacteristicYAML } from "./__fixtures__/data"

import "./registerCollectionRule"
import "../metadataValue/fromXML"
import "../metadataValue/toYAML"

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
})
