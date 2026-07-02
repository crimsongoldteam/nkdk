import { describe, expect, it } from "vitest"
import { dcsTypeLink } from "./__fixtures__/data"
import { importFromDcsXML } from "./fromDcsXML"
import { TypeLinkDcsValueRootXML } from "./types"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"

describe("import TypeLink from DCS XML", () => {
  it("imports dcs/typeLink.xml", () => {
    const parsed = readAndParseXMLFixture<TypeLinkDcsValueRootXML>(import.meta.url, "dcs/typeLink.xml")

    const result = importFromDcsXML(mockContextFromXML(), mockRule, parsed)

    expect(result).toEqual(dcsTypeLink)
  })
})
