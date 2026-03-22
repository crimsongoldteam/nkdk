import { describe, expect, it } from "vitest"
import { dcsTypeLink } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { importFromDcsXML } from "./fromDcsXML"
import { TypeLinkDcsValueRootXML } from "./types"

describe("importFromDcsXML", () => {
  it("should import DCS fragment to TypeLink", () => {
    const parsed = readAndParseXMLFixture<TypeLinkDcsValueRootXML>(import.meta.url, "dcs/typeLink.xml")

    const result = importFromDcsXML(mockContextFromXML(), mockRule, parsed)

    expect(result).toEqual(dcsTypeLink)
  })
})
