import { describe, expect, it } from "vitest"
import { multipleChoiceParameterLinks } from "~/metadata/commonObjects/сhoiceParameterLinks/__fixtures__/multiple"
import { singleChoiceParameterLinks } from "~/metadata/commonObjects/сhoiceParameterLinks/__fixtures__/single"
import { withStringDataPathChoiceParameterLinks } from "~/metadata/commonObjects/сhoiceParameterLinks/__fixtures__/withStringDataPath"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { importChoiceParameterLinksFromXML } from "./fromXML"
import { ChoiceParameterLinksXML } from "./types"

describe("importChoiceParameterLinksFromXML", () => {
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
