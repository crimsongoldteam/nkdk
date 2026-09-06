import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { dcsDecimalChoiceParameter } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { importChoiceParameterFromDcsXML } from "./fromDcsXML"
import { ChoiceParameterDcsValueRootXML } from "./types"

describe("importChoiceParameterFromDcsXML", () => {
  it("reads a structural choice parameter", () => {
    const xml = parseXmlDocumentWithSaxes('<dcscor:value xsi:type="dcscor:ChoiceParameters"><dcscor:item><dcscor:choiceParameter>Параметр</dcscor:choiceParameter><dcscor:value xsi:type="xs:decimal">123</dcscor:value></dcscor:item></dcscor:value>').roots[0]!
    Object.defineProperty(xml, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
    expect(importChoiceParameterFromDcsXML(mockContextFromXML(), mockRule, xml)).toEqual(dcsDecimalChoiceParameter)
  })

  it("should import DCS fragment to ChoiceParameter", () => {
    const parsed = readAndParseXMLFixture<ChoiceParameterDcsValueRootXML>(import.meta.url, "dcs/full.xml")

    const result = importChoiceParameterFromDcsXML(mockContextFromXML(), mockRule, parsed)

    expect(result).toEqual(dcsDecimalChoiceParameter)
  })
})
