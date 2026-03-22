import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { fixtureAppearanceFields } from "./__fixtures__/data"
import { exportAppearanceFieldsToDcsXML } from "./toDcsXML"

describe("exportAppearanceFieldsToDcsXML", () => {
  it("exports appearance.xml", () => {
    const exported = exportAppearanceFieldsToDcsXML(mockContext, fixtureAppearanceFields)
    const wrapped = { "dcsset:appearance": exported }
    const xml = xmlExport(wrapped, false)
    expect(importContentFromXML(xml)).toEqual(
      importContentFromXML(readXMLFixtureAsString(import.meta.url, "appearance.xml"))
    )
  })
})
