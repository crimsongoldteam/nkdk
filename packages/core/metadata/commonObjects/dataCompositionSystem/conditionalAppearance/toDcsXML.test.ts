import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import {
  fullConditionalAppearanceItem,
  minimalConditionalAppearanceItem,
} from "./__fixtures__/data"
import { exportConditionalAppearanceToDcsXML } from "./toDcsXML"

describe("exportConditionalAppearanceToDcsXML", () => {
  it("exports full.xml", () => {
    const exported = exportConditionalAppearanceToDcsXML(mockContext, [fullConditionalAppearanceItem])
    const xml = xmlExport({ ConditionalAppearance: exported }, false)
    expect(importContentFromXML(xml)).toEqual(
      importContentFromXML(readXMLFixtureAsString(import.meta.url, "full.xml"))
    )
  })

  it("exports minimal.xml", () => {
    const exported = exportConditionalAppearanceToDcsXML(mockContext, [minimalConditionalAppearanceItem])
    const xml = xmlExport({ ConditionalAppearance: exported }, false)
    expect(importContentFromXML(xml)).toEqual(
      importContentFromXML(readXMLFixtureAsString(import.meta.url, "minimal.xml"))
    )
  })
})
