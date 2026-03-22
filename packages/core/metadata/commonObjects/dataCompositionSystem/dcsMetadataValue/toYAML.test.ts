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
import { exportDcsMetadataValueToYAML } from "./toYAML"
import { DcsMetadataValuePropertyRule } from "./types"

const rule = (valueType: DcsMetadataValuePropertyRule["valueType"], typeSE?: DcsMetadataValuePropertyRule["typeSE"]) =>
  ({
    type: "MetadataDcsMetadataValue",
    valueType,
    ...(typeSE !== undefined ? { typeSE } : {}),
  }) as DcsMetadataValuePropertyRule

describe("exportDcsMetadataValueToYAML", () => {
  it("Color / color.xml", () => {
    expect(exportDcsMetadataValueToYAML(mockContext, rule("Color"), fixtureColorWebRed)).toBe(yamlColorWebRed)
  })
  it("Field / field.xml", () => {
    expect(exportDcsMetadataValueToYAML(mockContext, rule("Field"), fixtureFieldPath)).toBe(yamlFieldPath)
  })
  it("Primitive boolean / boolean.xml", () => {
    expect(exportDcsMetadataValueToYAML(mockContext, rule("Primitive"), fixtureBooleanPrimitive)).toBe(
      yamlBooleanPrimitive
    )
  })
  it("DesignTimeValue / localStringType.xml", () => {
    expect(exportDcsMetadataValueToYAML(mockContext, rule("DesignTimeValue"), fixtureLocalStringI8n)).toBe(
      yamlLocalStringI8n
    )
  })
  it("SystemEnumeration / horizontalAlign.xml", () => {
    expect(
      exportDcsMetadataValueToYAML(mockContext, rule("SystemEnumeration", "HorizontalAlign"), fixtureHorizontalAlign)
    ).toBe(yamlHorizontalAlign)
  })
  it("Font / font.xml", () => {
    expect(exportDcsMetadataValueToYAML(mockContext, rule("Font"), fixtureFontStyleExtraLarge)).toBe(
      yamlFontStyleExtraLarge
    )
  })
  it("TypeLink / typeLink.xml", () => {
    expect(exportDcsMetadataValueToYAML(mockContext, rule("TypeLink"), fixtureTypeLink)).toBe(yamlTypeLink)
  })
  it("ChoiceParameterLinks / choiceParameterLinks.xml", () => {
    expect(exportDcsMetadataValueToYAML(mockContext, rule("ChoiceParameterLinks"), fixtureChoiceParameterLinks)).toBe(
      yamlChoiceParameterLinks
    )
  })
  it("Parameter / choiceParameter.xml", () => {
    expect(exportDcsMetadataValueToYAML(mockContext, rule("Parameter"), fixtureChoiceParameterDecimal)).toEqual(
      yamlChoiceParameterDecimal
    )
  })
})
