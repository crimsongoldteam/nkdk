import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { fixtureConditionalAppearanceItem } from "./__fixtures__/data"
import { importConditionalAppearanceFromDcsXML } from "./fromDcsXML"
import type { ConditionalAppearanceXML } from "./fromDcsXML"

describe("importConditionalAppearanceFromDcsXML", () => {
  it("imports full.xml", () => {
    const parsed = readAndParseXMLFixture<{ ConditionalAppearance: ConditionalAppearanceXML }>(
      import.meta.url,
      "full.xml"
    )
    const result = importConditionalAppearanceFromDcsXML(
      mockContextFromXML(),
      parsed.ConditionalAppearance
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(fixtureConditionalAppearanceItem)
  })
})
