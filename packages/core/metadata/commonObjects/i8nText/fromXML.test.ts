import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import importContentFromXML from "~/xml/import/importer"
import { importI8nTextFromXML } from "./fromXML"
import { I8nTextXML } from "./types"

describe("importI8nTextFromXML", () => {
  it.each(i8nTextFixtures)("should import: $name", (fixture) => {
    const xml = fixture.xml ? importContentFromXML<{ Title: I8nTextXML }>(fixture.xml) : undefined
    const result = importI8nTextFromXML(mockContext, mockRule, xml?.Title)
    expect(result).toEqual(fixture.text)
  })
})
