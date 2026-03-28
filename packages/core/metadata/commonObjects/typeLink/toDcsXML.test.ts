import { describe, expect, it } from "vitest"
import { dcsTypeLink } from "./__fixtures__/data"
import { exportToDcsXML } from "./toDcsXML"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import importContentFromXML from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"

describe("export TypeLink to DCS XML", () => {
  it("exports dcs/typeLink.xml", () => {
    const exported = exportToDcsXML(mockContext, mockRule, dcsTypeLink)
    const xmlString = xmlExport(exported, false)

    expect(importContentFromXML(xmlString)).toEqual(
      importContentFromXML(readXMLFixtureAsString(import.meta.url, "dcs/typeLink.xml"))
    )
  })
})
