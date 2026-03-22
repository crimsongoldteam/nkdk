import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { dcsTypeLink } from "./__fixtures__/data"
import { exportToDcsXML } from "./toDcsXML"

describe("exportToDcsXML", () => {
  it("should export TypeLink to DCS fragment", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "dcs/typeLink.xml")

    const exported = exportToDcsXML(mockContext, mockRule, dcsTypeLink)
    const xmlString = xmlExport(exported, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
