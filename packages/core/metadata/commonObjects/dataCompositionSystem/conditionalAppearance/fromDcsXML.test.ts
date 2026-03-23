import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import {
  fullConditionalAppearanceItem,
  minimalConditionalAppearanceItem,
} from "./__fixtures__/data"
import { importConditionalAppearanceFromDcsXML } from "./fromDcsXML"
import type { ConditionalAppearanceXML } from "./fromDcsXML"

describe("importConditionalAppearanceFromDcsXML", () => {
  it("imports full.xml", () => {
    const parsed = readAndParseXMLFixture<{ ConditionalAppearance: ConditionalAppearanceXML }>(
      import.meta.url,
      "full.xml"
    )
    expect(importConditionalAppearanceFromDcsXML(mockContextFromXML(), parsed.ConditionalAppearance)).toEqual([
      fullConditionalAppearanceItem,
    ])
  })

  it("imports minimal.xml", () => {
    const parsed = readAndParseXMLFixture<{ ConditionalAppearance: ConditionalAppearanceXML }>(
      import.meta.url,
      "minimal.xml"
    )
    expect(importConditionalAppearanceFromDcsXML(mockContextFromXML(), parsed.ConditionalAppearance)).toEqual([
      minimalConditionalAppearanceItem,
    ])
  })
})
