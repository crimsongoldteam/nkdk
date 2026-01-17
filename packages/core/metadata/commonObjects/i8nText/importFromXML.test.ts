import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockСontext } from "~/tests/mockContext"
import { importI8nTextFromXML } from "./importFromXML"
import { I8nTextXML } from "./types"
import importContentFromXML from "~/xml/import/importer"

describe("importI8nTextFromXML", () => {
  it.each(i8nTextFixtures)("should import: $name", (fixture) => {
    const xml = fixture.xml ? importContentFromXML<{ Title: I8nTextXML }>(fixture.xml) : undefined
    const result = importI8nTextFromXML(mockСontext, xml?.Title)
    expect(result).toEqual(fixture.text)
  })
})
