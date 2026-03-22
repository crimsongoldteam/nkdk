import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
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
  yamlBooleanPrimitive,
  yamlChoiceParameterDecimal,
  yamlChoiceParameterLinks,
  yamlColorWebRed,
  yamlFieldPath,
  yamlFontStyleExtraLarge,
  yamlHorizontalAlign,
  yamlLocalStringI8n,
  yamlTypeLink,
} from "./__fixtures__/data"
import { importDcsMetadataValueFromYAML } from "./fromYAML"
import { DcsMetadataValuePropertyRule } from "./types"

const rule = (valueType: DcsMetadataValuePropertyRule["valueType"], typeSE?: DcsMetadataValuePropertyRule["typeSE"]) =>
  ({
    type: "MetadataDcsMetadataValue",
    valueType,
    ...(typeSE !== undefined ? { typeSE } : {}),
  }) as DcsMetadataValuePropertyRule

describe("importDcsMetadataValueFromYAML", () => {
  it("Color", () => {
    expect(importDcsMetadataValueFromYAML(mockContext, rule("Color"), yamlColorWebRed)).toEqual(fixtureColorWebRed)
  })
  it("Field", () => {
    expect(importDcsMetadataValueFromYAML(mockContext, rule("Field"), yamlFieldPath)).toBe(fixtureFieldPath)
  })
  it("Primitive boolean", () => {
    expect(importDcsMetadataValueFromYAML(mockContext, rule("Primitive"), yamlBooleanPrimitive)).toEqual(
      fixtureBooleanPrimitive
    )
  })
  it("DesignTimeValue", () => {
    expect(importDcsMetadataValueFromYAML(mockContext, rule("DesignTimeValue"), yamlLocalStringI8n)).toEqual(
      fixtureLocalStringI8n
    )
  })
  it("SystemEnumeration", () => {
    expect(
      importDcsMetadataValueFromYAML(mockContext, rule("SystemEnumeration", "HorizontalAlign"), yamlHorizontalAlign)
    ).toBe(fixtureHorizontalAlign)
  })
  it("Font", () => {
    expect(importDcsMetadataValueFromYAML(mockContext, rule("Font"), yamlFontStyleExtraLarge)).toEqual(
      fixtureFontStyleExtraLarge
    )
  })
  it("TypeLink", () => {
    expect(importDcsMetadataValueFromYAML(mockContext, rule("TypeLink"), yamlTypeLink)).toEqual(fixtureTypeLink)
  })
  it("ChoiceParameterLinks", () => {
    expect(
      importDcsMetadataValueFromYAML(mockContext, rule("ChoiceParameterLinks"), yamlChoiceParameterLinks)
    ).toEqual(fixtureChoiceParameterLinks)
  })
  it("Parameter", () => {
    expect(importDcsMetadataValueFromYAML(mockContext, rule("Parameter"), yamlChoiceParameterDecimal)).toEqual(
      fixtureChoiceParameterDecimal
    )
  })
})
