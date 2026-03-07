import { describe, expect, it } from "vitest"
import { childItemsFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChildItemsToXML } from "./toXML"

describe("exportChildItemsToXML", () => {
  it.each(childItemsFixturesTable.filter((fixture) => fixture.xmlPath))("$name", ({ element, xmlPath }) => {
    const expectedXML = readXMLFileAsString(xmlPath!)

    const result = exportChildItemsToXML(mockContextToXML(), mockRule, element)

    const xml = xmlExport({ ChildItems: result }, false)
    expect(xml).toEqual(expectedXML)
  })
})
