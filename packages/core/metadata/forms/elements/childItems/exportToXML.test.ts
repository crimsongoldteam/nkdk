import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/exportToXML"
import "~/metadata/forms/elements/inputField/exportToXML"
import { childItemsExportFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChildItemsToXML } from "./exportToXML"

describe("exportChildItemsToXML", () => {
  it.each(childItemsExportFixturesTable.filter((fixture) => fixture.xmlPath))("$name", ({ element, xmlPath }) => {
    const expectedXML = readXMLFileAsString(xmlPath!)

    const result = exportChildItemsToXML(mockСontext, element)

    const xml = xmlExport({ ChildItems: result }, false)
    expect(xml).toEqual(expectedXML)
  })
})
