import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import type { CollectableElement, ElementXML } from "../../../orchestration"
import { importElementFromXML } from "../../../orchestration"
import { getElementXMLTagName } from "../../../orchestration/formElement/ruleFactory"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { groupedFixtures, type ElementFixture } from "./fixtures"

const __dirname = dirname(fileURLToPath(import.meta.url))

function fixtureXmlBaseDir(fixture: ElementFixture): string {
  const folder = fixture.xmlFolder ?? fixture.group.charAt(0).toLowerCase() + fixture.group.slice(1)
  return resolve(__dirname, `../${folder}/__fixtures__`)
}

describe("importElementFromXML", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const model = fixture.model as CollectableElement
      const xmlData = readAndParseXMLFile<Record<string, ElementXML>>(fixture.xml, fixtureXmlBaseDir(fixture))

      const xmlTag = getElementXMLTagName(model.itemType)
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: model.itemType,
        xml: xmlData[model.itemType] ?? xmlData[xmlTag],
      })

      expect(result).toEqual(model)
    })
  })
})
