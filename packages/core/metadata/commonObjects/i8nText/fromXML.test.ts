import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import importContentFromXML from "../../../xml/import/importer"
import { importI8nTextFromXML } from "./fromXML"
import { I8nTextPropertyRule, I8nTextXML } from "./types"

const preserveEmptyXMLRule: I8nTextPropertyRule = {
  yaml: "Шапка",
  type: "I8nText",
  preserveEmptyXML: true,
}

describe("importI8nTextFromXML", () => {
  it.each(i8nTextFixtures)("should import: $name", (fixture) => {
    const xml = fixture.xml ? importContentFromXML<{ Title: I8nTextXML }>(fixture.xml) : undefined
    const result = importI8nTextFromXML(mockContextFromXML(), mockRule, xml?.Title)
    expect(result).toEqual(fixture.text)
  })

  it("imports empty XML tag as empty text when rule opts in", () => {
    const result = importI8nTextFromXML(mockContextFromXML(), preserveEmptyXMLRule, {})

    expect(result).toEqual({ items: {} })
  })
})
