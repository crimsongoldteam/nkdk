import { describe, expect, it } from "vitest"
import { multipleChoiceParameterLinks } from "./__fixtures__/multiple"
import { singleChoiceParameterLinks } from "./__fixtures__/single"
import { withStringDataPathChoiceParameterLinks } from "./__fixtures__/withStringDataPath"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importChoiceParameterLinksFromXML } from "./fromXML"
import { ChoiceParameterLinksXML } from "./types"
import { xmlFixtureValue as importContentFromXML } from "../../../tests/xmlFixtureValue"

describe("importChoiceParameterLinksFromXML", () => {
  it("keeps empty name and value-change fields absent", () => {
    const xml = "<ChoiceParameterLinks><xr:Link><xr:Name/><xr:DataPath/><xr:ValueChange/></xr:Link></ChoiceParameterLinks>"
    const expected = [{ name: undefined, dataPath: undefined, valueChange: undefined }]
    expect(importChoiceParameterLinksFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(xml).ChoiceParameterLinks)).toEqual(expected)
    expect(importChoiceParameterLinksFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it.each(["<ChoiceParameterLinks/>", "<ChoiceParameterLinks><![CDATA[]]></ChoiceParameterLinks>"])("keeps empty structural collection %s absent", (xml) => {
    expect(importChoiceParameterLinksFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toBeUndefined()
  })

  it.each([
    ["single.xml", singleChoiceParameterLinks],
    ["multiple.xml", multipleChoiceParameterLinks],
    ["withStringDataPath.xml", withStringDataPathChoiceParameterLinks],
  ])("imports structural %s", (path, expected) => {
    const source = parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, path))
    expect(importChoiceParameterLinksFromXML(mockContextFromXML(), mockRule, source)).toEqual(expected)
  })

  it("should return undefined for undefined input", () => {
    const result = importChoiceParameterLinksFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import ChoiceParameterLinks with single Link", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      import.meta.url,
      "single.xml"
    )
    const expectedResult = singleChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })

  it("should import ChoiceParameterLinks with multiple Links", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      import.meta.url,
      "multiple.xml"
    )
    const expectedResult = multipleChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })

  it("should import ChoiceParameterLinks with DataPath as string", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      import.meta.url,
      "withStringDataPath.xml"
    )
    const expectedResult = withStringDataPathChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })
})
