import { describe, expect, it } from "vitest"
import type { CollectableElement, ElementXML } from "~/metadata/orchestration"
import { importElementFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { groupedFixtures } from "./fixtures"

function fixtureXmlPath(group: string, xmlFile: string): string {
  const folder = group.charAt(0).toLowerCase() + group.slice(1)
  return `forms/${folder}/${xmlFile}`
}

describe("importElementFromXML", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const model = fixture.model as CollectableElement
      const xmlData = readAndParseXMLFile<Record<string, ElementXML>>(
        fixtureXmlPath(fixture.group, fixture.xml)
      )

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: model.itemType,
        xml: xmlData[model.itemType],
      })

      expect(result).toEqual(model)
    })
  })
})
