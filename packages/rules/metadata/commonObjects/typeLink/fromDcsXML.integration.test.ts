import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { dcsTypeLink } from "./__fixtures__/data"
import { importFromDcsXML } from "./fromDcsXML"
import { TypeLinkDcsValueRootXML } from "./types"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"

describe("import TypeLink from DCS XML", () => {
  it("reads a structural type link", () => {
    const xml = parseXmlDocumentWithSaxes('<dcscor:value xsi:type="dcscor:TypeLink"><dcscor:field>Поле1</dcscor:field><dcscor:linkItem>2</dcscor:linkItem></dcscor:value>').roots[0]!
    Object.defineProperty(xml, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
    expect(importFromDcsXML(mockContextFromXML(), mockRule, xml)).toEqual(dcsTypeLink)
  })

  it("imports dcs/typeLink.xml", () => {
    const parsed = readAndParseXMLFixture<TypeLinkDcsValueRootXML>(import.meta.url, "dcs/typeLink.xml")

    const result = importFromDcsXML(mockContextFromXML(), mockRule, parsed)

    expect(result).toEqual(dcsTypeLink)
  })
})
