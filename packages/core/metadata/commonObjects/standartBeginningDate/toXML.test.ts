import { describe, expect, it } from "vitest"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { fullStandartBeginningDate } from "./__fixtures__/data"
import { exportStandartBeginningDateToXML } from "./toXML"

describe("exportStandartBeginningDateToXML", () => {
  it("exports full.xml", () => {
    const exported = exportStandartBeginningDateToXML(fullStandartBeginningDate)
    const xml = xmlExport({ "dcsset:right": exported }, false)

    expect(importContentFromXML(xml)).toEqual(importContentFromXML(readXMLFixtureAsString(import.meta.url, "full.xml")))
  })
})
