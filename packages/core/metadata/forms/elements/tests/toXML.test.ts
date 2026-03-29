import { describe, expect, it } from "vitest"
import type { CollectableElement } from "~/metadata/orchestration"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { groupedFixtures } from "./fixtures"

function fixtureXmlPath(group: string, xmlFile: string): string {
  const folder = group.charAt(0).toLowerCase() + group.slice(1)
  return `forms/${folder}/${xmlFile}`
}

describe("exportElementToXML", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const resultData = testExportElementToXML({
        element: fixture.model as CollectableElement,
        path: fixtureXmlPath(fixture.group, fixture.xml),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
