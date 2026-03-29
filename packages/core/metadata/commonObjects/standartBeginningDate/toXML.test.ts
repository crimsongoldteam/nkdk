import { describe, expect, it } from "vitest"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { fullStandartBeginningDate } from "./__fixtures__/data"
import { exportStandartBeginningDateToXML } from "./toXML"

describe("exportStandartBeginningDateToXML", () => {
  it("exports full.xml", () => {
    const exported = exportStandartBeginningDateToXML(fullStandartBeginningDate)
    const xml = xmlExport({ "dcsset:right": exported }, false)

    expect(xml).toEqual(readXMLFixtureAsString(import.meta.url, "full.xml"))
  })
})
