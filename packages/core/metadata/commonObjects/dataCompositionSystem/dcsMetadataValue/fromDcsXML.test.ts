import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { importDcsMetadataValueFromDcsXML } from "./fromDcsXML"
import {
  fixtureBooleanPrimitive,
  fixtureChoiceParameterDecimal,
  fixtureChoiceParameterLinks,
  fixtureColorWebRed,
  fixtureFieldPath,
  fixtureFontStyleExtraLarge,
  fixtureHorizontalAlign,
  fixtureLocalStringI8n,
  fixtureTypeLink,
} from "./__fixtures__/data"
import { DcsMetadataValuePropertyRule, MetadataDcsMetadataValueDcsRootXML } from "./types"

const rule = (valueType: DcsMetadataValuePropertyRule["valueType"], typeSE?: DcsMetadataValuePropertyRule["typeSE"]) =>
  ({
    type: "MetadataDcsMetadataValue",
    valueType,
    ...(typeSE !== undefined ? { typeSE } : {}),
  }) as DcsMetadataValuePropertyRule

describe("importDcsMetadataValueFromDcsXML", () => {
  it("imports Color", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "color.xml")
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("Color"), parsed)).toEqual(fixtureColorWebRed)
  })

  it("imports Field", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "field.xml")
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("Field"), parsed)).toEqual(fixtureFieldPath)
  })

  it("imports Primitive boolean", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "boolean.xml")
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("Primitive"), parsed)).toEqual(fixtureBooleanPrimitive)
  })

  it("imports DesignTimeValue (LocalStringType)", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "localStringType.xml")
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("DesignTimeValue"), parsed)).toEqual(
      fixtureLocalStringI8n
    )
  })

  it("imports SystemEnumeration (HorizontalAlign)", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "horizontalAlign.xml")
    expect(
      importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("SystemEnumeration", "HorizontalAlign"), parsed)
    ).toEqual(fixtureHorizontalAlign)
  })

  it("imports Font", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "font.xml")
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("Font"), parsed)).toEqual(fixtureFontStyleExtraLarge)
  })

  it("imports TypeLink", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "typeLink.xml")
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("Primitive"), parsed)).toEqual(fixtureTypeLink)
  })

  it("imports ChoiceParameterLinks", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "choiceParameterLinks.xml")
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("Primitive"), parsed)).toEqual(
      fixtureChoiceParameterLinks
    )
  })

  it("imports ChoiceParameter", () => {
    const parsed = readAndParseXMLFixture<MetadataDcsMetadataValueDcsRootXML>(import.meta.url, "choiceParameter.xml")
    expect(importDcsMetadataValueFromDcsXML(mockContextFromXML(), rule("Parameter"), parsed)).toEqual(
      fixtureChoiceParameterDecimal
    )
  })
})
