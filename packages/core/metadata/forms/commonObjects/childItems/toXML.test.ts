import { describe, expect, it } from "vitest"
import { childItemsFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChildItemsToXML } from "./toXML"
import { setIdsToElements } from "../../clientApplicationForm/toXML"

describe("exportChildItemsToXML", () => {
  it.each(childItemsFixturesTable.filter((fixture) => fixture.xmlPath))("$name", ({ element, xmlPath }) => {
    const expectedXML = readXMLFileAsString(xmlPath!)

    const context = mockContextToXML()
    const result = exportChildItemsToXML(context, mockRule, element)

    setIdsToElements(context)

    const xml = xmlExport({ ChildItems: result }, false)
    expect(xml).toEqual(expectedXML)
  })
})
