import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
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
import { exportDcsMetadataValueToDcsXML } from "./toDcsXML"
import { DcsMetadataValuePropertyRule } from "./types"

const rule = (valueType: DcsMetadataValuePropertyRule["valueType"], typeSE?: DcsMetadataValuePropertyRule["typeSE"]) =>
  ({
    type: "MetadataDcsMetadataValue",
    valueType,
    ...(typeSE !== undefined ? { typeSE } : {}),
  }) as DcsMetadataValuePropertyRule

const expectExportedMatchesFixture = (fixtureName: string, exported: ReturnType<typeof exportDcsMetadataValueToDcsXML>) => {
  const xml = xmlExport(exported, false)
  expect(importContentFromXML(xml)).toEqual(importContentFromXML(readXMLFixtureAsString(import.meta.url, fixtureName)))
}

describe("exportDcsMetadataValueToDcsXML", () => {
  it("exports Color", () => {
    expectExportedMatchesFixture(
      "color.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("Color"),
        data: fixtureColorWebRed,
      })
    )
  })

  it("exports Field", () => {
    expectExportedMatchesFixture(
      "field.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("Field"),
        data: fixtureFieldPath,
      })
    )
  })

  it("exports Primitive boolean", () => {
    expectExportedMatchesFixture(
      "boolean.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("Primitive"),
        data: fixtureBooleanPrimitive,
      })
    )
  })

  it("exports DesignTimeValue", () => {
    expectExportedMatchesFixture(
      "localStringType.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("DesignTimeValue"),
        data: fixtureLocalStringI8n,
      })
    )
  })

  it("exports SystemEnumeration (HorizontalAlign)", () => {
    expectExportedMatchesFixture(
      "horizontalAlign.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("SystemEnumeration", "HorizontalAlign"),
        data: fixtureHorizontalAlign,
      })
    )
  })

  it("exports Font", () => {
    expectExportedMatchesFixture(
      "font.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("Font"),
        data: fixtureFontStyleExtraLarge,
      })
    )
  })

  it("exports TypeLink", () => {
    expectExportedMatchesFixture(
      "typeLink.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("TypeLink"),
        data: fixtureTypeLink,
      })
    )
  })

  it("exports ChoiceParameterLinks", () => {
    expectExportedMatchesFixture(
      "choiceParameterLinks.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("ChoiceParameterLinks"),
        data: fixtureChoiceParameterLinks,
      })
    )
  })

  it("exports ChoiceParameter", () => {
    expectExportedMatchesFixture(
      "choiceParameter.xml",
      exportDcsMetadataValueToDcsXML({
        context: mockContext,
        rule: rule("Parameter"),
        data: fixtureChoiceParameterDecimal,
      })
    )
  })
})
