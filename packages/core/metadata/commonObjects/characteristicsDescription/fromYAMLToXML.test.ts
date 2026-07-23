import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  readAppliedObjectFixture,
  serializeDirectXML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { multipleCharacteristicsYAML, singleCharacteristicYAML } from "./__fixtures__/data"

import "./registerCollectionRule"
import "../metadataValue/fromXML"
import "../metadataValue/fromYAML"
import "../metadataValue/toXML"

const rule = {
  itemType: "CharacteristicsDescriptionProbe",
  properties: {
    value: { type: "CharacteristicsDescriptions", yaml: "Характеристики", xml: "Characteristics" },
  },
} as MetadataItemRule

describe("CharacteristicsDescriptions YAML → XML", () => {
  it("imports undefined", () => {
    expect(testPropertyFromYAMLToXML({ rule, yaml: {} }).xml).toEqual({})
  })

  it("imports empty array", () => {
    expect(testPropertyFromYAMLToXML({ rule, yaml: { Характеристики: [] } }).xml).toEqual({})
  })

  it.each([
    ["single", "single.xml", singleCharacteristicYAML],
    ["multiple", "multiple.xml", multipleCharacteristicsYAML],
  ])("exports %s characteristic (round-trip)", (_name, fixture, value) => {
    const referenceXML = readAppliedObjectFixture(import.meta.url, fixture)
    const roundTrip = createDirectRoundTripContexts()
    testPropertyFromXMLToYAML({ rule, xml: referenceXML, context: roundTrip.importContext })
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: { Характеристики: value },
      referenceXML,
      context: roundTrip.exportContext(),
    })

    expect(normalizeXML(serializeDirectXML(result.xml))).toBe(
      normalizeXML(readXMLFixtureAsString(import.meta.url, fixture))
    )
  })

  it("does not materialize missing XML default fields without reference tags", () => {
    const result = testPropertyFromYAMLToXML({ rule, yaml: { Характеристики: singleCharacteristicYAML } })
    const xml = serializeDirectXML(result.xml)

    expect(xml).not.toContain("<xr:DataPathField>-1</xr:DataPathField>")
    expect(xml).not.toContain("<xr:MultipleValuesUseField>-1</xr:MultipleValuesUseField>")
    expect(xml).not.toContain("<xr:MultipleValuesKeyField>-1</xr:MultipleValuesKeyField>")
    expect(xml).not.toContain("<xr:MultipleValuesOrderField>-1</xr:MultipleValuesOrderField>")
  })

  it("preserves explicit XML default fields from reference", () => {
    const referenceXML = readAppliedObjectFixture(import.meta.url, "single.xml")
    const roundTrip = createDirectRoundTripContexts()
    testPropertyFromXMLToYAML({ rule, xml: referenceXML, context: roundTrip.importContext })
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: { Характеристики: singleCharacteristicYAML },
      referenceXML,
      context: roundTrip.exportContext(),
    })
    const xml = serializeDirectXML(result.xml)

    expect(xml).toContain("<xr:DataPathField>-1</xr:DataPathField>")
    expect(xml).toContain("<xr:MultipleValuesUseField>-1</xr:MultipleValuesUseField>")
    expect(xml).toContain("<xr:MultipleValuesKeyField>-1</xr:MultipleValuesKeyField>")
    expect(xml).toContain("<xr:MultipleValuesOrderField>-1</xr:MultipleValuesOrderField>")
  })
})

const normalizeXML = (value: string): string =>
  value
    .replace(/^\ufeff?<\?xml version="1\.0" encoding="UTF-8"\?>\n/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()
