import { describe, expect, it } from "vitest"
import { multipleChoiceParameterLinks } from "~/tests/fixtures/сhoiceParameterLinks/multiple"
import { singleChoiceParameterLinks } from "~/tests/fixtures/сhoiceParameterLinks/single"
import { withStringDataPathChoiceParameterLinks } from "~/tests/fixtures/сhoiceParameterLinks/withStringDataPath"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importChoiceParameterLinksFromXML } from "./fromXML"
import { ChoiceParameterLinksXML } from "./types"

describe("importChoiceParameterLinksFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParameterLinksFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import ChoiceParameterLinks with single Link", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      "сhoiceParameterLinks/single.xml"
    )
    const expectedResult = singleChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockContext, mockRule, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })

  it("should import ChoiceParameterLinks with multiple Links", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      "сhoiceParameterLinks/multiple.xml"
    )
    const expectedResult = multipleChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockContext, mockRule, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })

  it("should import ChoiceParameterLinks with DataPath as string", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      "сhoiceParameterLinks/withStringDataPath.xml"
    )
    const expectedResult = withStringDataPathChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockContext, mockRule, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })
})
