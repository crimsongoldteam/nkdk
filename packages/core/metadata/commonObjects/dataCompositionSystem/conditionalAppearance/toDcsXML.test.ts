import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { fixtureConditionalAppearanceItem } from "./__fixtures__/data"
import { exportConditionalAppearanceToDcsXML } from "./toDcsXML"

describe("exportConditionalAppearanceToDcsXML", () => {
  it("exports full.xml", () => {
    const exported = exportConditionalAppearanceToDcsXML(mockContext, [fixtureConditionalAppearanceItem])
    const wrapped = { ConditionalAppearance: exported }
    const xml = xmlExport(wrapped, false)
    expect(importContentFromXML(xml)).toEqual(
      importContentFromXML(readXMLFixtureAsString(import.meta.url, "full.xml"))
    )
  })
})
