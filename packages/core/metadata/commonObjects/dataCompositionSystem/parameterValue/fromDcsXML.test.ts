import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import {
  fixtureChoiceParameterLinksRoot,
  fixtureChoiceParametersRoot,
  fixtureFewDesignTimeValues,
  fixtureFoldersAndItemsRoot,
  fixtureFullSettingsParameter,
  fixtureTypeLinkParameter,
  fixtureUseFalseColor,
} from "./__fixtures__/data"
import { importParameterValueFromDcsXML } from "./fromDcsXML"
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

const itemRoot = (parsed: { "dcscor:item": ParameterValueXML }): ParameterValueXML => parsed["dcscor:item"]

describe("importParameterValueFromDcsXML", () => {
  it("imports full.xml (DesignTimeValue / LocalStringType)", () => {
    const parsed = readAndParseXMLFixture<{ "dcscor:item": ParameterValueXML }>(import.meta.url, "full.xml")
    expect(importParameterValueFromDcsXML(mockContextFromXML(), rule("DesignTimeValue"), itemRoot(parsed))).toEqual(
      fixtureFullSettingsParameter
    )
  })

  it("imports useFalse.xml (Color)", () => {
    const parsed = readAndParseXMLFixture<{ "dcscor:item": ParameterValueXML }>(import.meta.url, "useFalse.xml")
    expect(importParameterValueFromDcsXML(mockContextFromXML(), rule("Color"), itemRoot(parsed))).toEqual(
      fixtureUseFalseColor
    )
  })

  it("imports typeLink.xml (TypeLink, без xsi:type)", () => {
    const parsed = readAndParseXMLFixture<{ "dcscor:item": ParameterValueXML }>(import.meta.url, "typeLink.xml")
    expect(importParameterValueFromDcsXML(mockContextFromXML(), rule("TypeLink"), itemRoot(parsed))).toEqual(
      fixtureTypeLinkParameter
    )
  })

  it("imports choiceParameters.xml (Parameter)", () => {
    const parsed = readAndParseXMLFixture<{ "dcscor:item": ParameterValueXML }>(import.meta.url, "choiceParameters.xml")
    expect(importParameterValueFromDcsXML(mockContextFromXML(), rule("Parameter"), itemRoot(parsed))).toEqual(
      fixtureChoiceParametersRoot
    )
  })

  it("imports choiceParameterLinks.xml (ChoiceParameterLinks)", () => {
    const parsed = readAndParseXMLFixture<{ "dcscor:item": ParameterValueXML }>(
      import.meta.url,
      "choiceParameterLinks.xml"
    )
    expect(
      importParameterValueFromDcsXML(mockContextFromXML(), rule("ChoiceParameterLinks"), itemRoot(parsed))
    ).toEqual(fixtureChoiceParameterLinksRoot)
  })

  it("imports systemEnumeration.xml (SystemEnumeration)", () => {
    const parsed = readAndParseXMLFixture<{ "dcscor:item": ParameterValueXML }>(
      import.meta.url,
      "systemEnumeration.xml"
    )
    expect(
      importParameterValueFromDcsXML(
        mockContextFromXML(),
        rule("SystemEnumeration", "FoldersAndItemsUse"),
        itemRoot(parsed)
      )
    ).toEqual(fixtureFoldersAndItemsRoot)
  })

  it("imports fewValues.xml (два v8:LocalStringType)", () => {
    const parsed = readAndParseXMLFixture<{ "dcscor:item": ParameterValueXML }>(import.meta.url, "fewValues.xml")
    expect(importParameterValueFromDcsXML(mockContextFromXML(), rule("DesignTimeValue"), itemRoot(parsed))).toEqual(
      fixtureFewDesignTimeValues
    )
  })
})
