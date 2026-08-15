import { describe, expect, it } from "vitest"
import { dcsDecimalChoiceParameter } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { importChoiceParameterFromDcsXML } from "./fromDcsXML"
import { ChoiceParameterDcsValueRootXML } from "./types"

describe("importChoiceParameterFromDcsXML", () => {
  it("should import DCS fragment to ChoiceParameter", () => {
    const parsed = readAndParseXMLFixture<ChoiceParameterDcsValueRootXML>(import.meta.url, "dcs/full.xml")

    const result = importChoiceParameterFromDcsXML(mockContextFromXML(), mockRule, parsed)

    expect(result).toEqual(dcsDecimalChoiceParameter)
  })
})
