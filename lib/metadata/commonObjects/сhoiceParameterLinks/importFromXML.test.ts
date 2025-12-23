import { describe, expect, it } from "vitest"
import { multipleChoiceParameterLinks } from "~/lib/tests/fixtures/сhoiceParameterLinks/multiple"
import { singleChoiceParameterLinks } from "~/lib/tests/fixtures/сhoiceParameterLinks/single"
import { withStringDataPathChoiceParameterLinks } from "~/lib/tests/fixtures/сhoiceParameterLinks/withStringDataPath"
import { mockcontext } from "~/lib/tests/mockContext"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importChoiceParameterLinksFromXML } from "./importFromXML"
import { ChoiceParameterLinksXML } from "./types"

describe("importChoiceParameterLinksFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParameterLinksFromXML(mockcontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import ChoiceParameterLinks with single Link", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      "сhoiceParameterLinks/single.xml"
    )
    const expectedResult = singleChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockcontext, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })

  it("should import ChoiceParameterLinks with multiple Links", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      "сhoiceParameterLinks/multiple.xml"
    )
    const expectedResult = multipleChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockcontext, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })

  it("should import ChoiceParameterLinks with DataPath as string", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      "сhoiceParameterLinks/withStringDataPath.xml"
    )
    const expectedResult = withStringDataPathChoiceParameterLinks

    const result = importChoiceParameterLinksFromXML(mockcontext, xmlData.ChoiceParameterLinks)

    expect(result).toEqual(expectedResult)
  })
})
