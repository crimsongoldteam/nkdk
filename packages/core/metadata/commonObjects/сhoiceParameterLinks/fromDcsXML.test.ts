import { describe, expect, it } from "vitest"
import { singleChoiceParameterLinks } from "~/metadata/commonObjects/сhoiceParameterLinks/__fixtures__/single"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { importFromDcsXML } from "./fromDcsXML"
import { ChoiceParameterLinkDcsValueRootXML } from "./types"

describe("importFromDcsXML", () => {
  it("should import DCS fragment to ChoiceParameterLink", () => {
    const parsed = readAndParseXMLFixture<ChoiceParameterLinkDcsValueRootXML>(
      import.meta.url,
      "dcs/choiceParameterLinks.xml"
    )
    const expected = singleChoiceParameterLinks[0]

    const result = importFromDcsXML(mockContextFromXML(), mockRule, parsed)

    expect(result).toEqual(expected)
  })
})
