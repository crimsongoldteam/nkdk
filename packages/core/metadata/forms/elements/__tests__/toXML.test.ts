import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import type { CollectableElement } from "~/metadata/orchestration"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { groupedFixtures, type ElementFixture } from "./fixtures"

const __dirname = dirname(fileURLToPath(import.meta.url))

function fixtureXmlBaseDir(fixture: ElementFixture): string {
  const folder =
    fixture.xmlFolder ??
    fixture.group.charAt(0).toLowerCase() + fixture.group.slice(1)
  return resolve(__dirname, `../${folder}/__fixtures__`)
}

describe("exportElementToXML", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const resultData = testExportElementToXML({
        element: fixture.model as CollectableElement,
        path: fixture.xml,
        baseDir: fixtureXmlBaseDir(fixture),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
