import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { childItemsFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChildItemsToXML } from "./exportToXML"

describe("exportChildItemsToXML", () => {
  it.each(childItemsFixturesTable.filter((fixture) => fixture.xmlPath))("$name", ({ element, xmlPath }) => {
    const expectedXML = readXMLFileAsString(xmlPath!)

    const result = exportChildItemsToXML(mockСontext, element)

    const xml = xmlExport({ ChildItems: result }, false)
    expect(xml).toEqual(expectedXML)
  })
})
