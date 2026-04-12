import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { SystemEnumerationDcsValueRootXML } from "./dcsTypes"
import { importSystemEnumerationFromDcsXML } from "./fromDcsXML"
import { SystemEnumerationPropertyRule } from "./types"

describe("importSystemEnumerationFromDcsXML", () => {
  it("should import DCS fragment to HorizontalAlign value", () => {
    const rule = {
      type: "SystemEnumeration",
      typeSE: "HorizontalAlign",
    } as SystemEnumerationPropertyRule

    const parsed = readAndParseXMLFixture<SystemEnumerationDcsValueRootXML>(
      import.meta.url,
      "dcs/horizontalAlign.xml"
    )

    const result = importSystemEnumerationFromDcsXML(mockContextFromXML(), rule, parsed)

    expect(result).toEqual("Center")
  })
})
