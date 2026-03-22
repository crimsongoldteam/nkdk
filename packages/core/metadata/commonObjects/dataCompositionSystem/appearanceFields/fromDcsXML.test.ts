import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { fixtureAppearanceFields } from "./__fixtures__/data"
import { importAppearanceFieldsFromDcsXML } from "./fromDcsXML"
import type { AppearanceFieldsXML } from "./types"

describe("importAppearanceFieldsFromDcsXML", () => {
  it("imports appearance.xml", () => {
    const parsed = readAndParseXMLFixture<{ "dcsset:appearance": AppearanceFieldsXML }>(
      import.meta.url,
      "appearance.xml"
    )
    expect(importAppearanceFieldsFromDcsXML(mockContextFromXML(), parsed["dcsset:appearance"])).toEqual(
      fixtureAppearanceFields
    )
  })
})
