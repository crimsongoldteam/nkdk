import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import {
  fixtureChoiceParameterLinksRoot,
  fixtureChoiceParametersRoot,
  fixtureFewDesignTimeValues,
  fixtureFoldersAndItemsRoot,
  fixtureFullSettingsParameter,
  fixtureTypeLinkParameter,
  fixtureUseFalseColor,
} from "./__fixtures__/data"
import { exportParameterValueToDcsXML } from "./toDcsXML"
import type { ParameterValueXML, SettingsParameterValuePropertyRule } from "./types"

const rule = (
  valueType: SettingsParameterValuePropertyRule["valueType"],
  typeSE?: SettingsParameterValuePropertyRule["typeSE"]
): SettingsParameterValuePropertyRule =>
  ({
    type: "SettingsParameterValue",
    valueType,
    ...(typeSE !== undefined ? { typeSE } : {}),
  }) as SettingsParameterValuePropertyRule

const expectExportedItemMatchesFixture = (fixtureName: string, exported: ParameterValueXML) => {
  const wrapped = { "dcscor:item": exported }
  const xml = xmlExport(wrapped, false)
  expect(importContentFromXML(xml)).toEqual(importContentFromXML(readXMLFixtureAsString(import.meta.url, fixtureName)))
}

describe("exportParameterValueToDcsXML", () => {
  it("exports full.xml", () => {
    expectExportedItemMatchesFixture(
      "full.xml",
      exportParameterValueToDcsXML({
        context: mockContext,
        rule: rule("DesignTimeValue"),
        data: fixtureFullSettingsParameter,
        rootSettingsXsi: true,
      })
    )
  })

  it("exports useFalse.xml", () => {
    expectExportedItemMatchesFixture(
      "useFalse.xml",
      exportParameterValueToDcsXML({
        context: mockContext,
        rule: rule("Color"),
        data: fixtureUseFalseColor,
        rootSettingsXsi: true,
      })
    )
  })

  it("exports typeLink.xml (вложенный item без xsi:type)", () => {
    expectExportedItemMatchesFixture(
      "typeLink.xml",
      exportParameterValueToDcsXML({
        context: mockContext,
        rule: rule("TypeLink"),
        data: fixtureTypeLinkParameter,
        rootSettingsXsi: true,
      })
    )
  })

  it("exports choiceParameters.xml", () => {
    expectExportedItemMatchesFixture(
      "choiceParameters.xml",
      exportParameterValueToDcsXML({
        context: mockContext,
        rule: rule("Parameter"),
        data: fixtureChoiceParametersRoot,
        rootSettingsXsi: true,
      })
    )
  })

  it("exports choiceParameterLinks.xml", () => {
    expectExportedItemMatchesFixture(
      "choiceParameterLinks.xml",
      exportParameterValueToDcsXML({
        context: mockContext,
        rule: rule("ChoiceParameterLinks"),
        data: fixtureChoiceParameterLinksRoot,
        rootSettingsXsi: true,
      })
    )
  })

  it("exports systemEnumeration.xml", () => {
    expectExportedItemMatchesFixture(
      "systemEnumeration.xml",
      exportParameterValueToDcsXML({
        context: mockContext,
        rule: rule("SystemEnumeration", "FoldersAndItemsUse"),
        data: fixtureFoldersAndItemsRoot,
        rootSettingsXsi: true,
      })
    )
  })

  it("exports fewValues.xml", () => {
    expectExportedItemMatchesFixture(
      "fewValues.xml",
      exportParameterValueToDcsXML({
        context: mockContext,
        rule: rule("DesignTimeValue"),
        data: fixtureFewDesignTimeValues,
        rootSettingsXsi: true,
      })
    )
  })
})
