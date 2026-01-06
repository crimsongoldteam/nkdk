import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/importFromXML"
import "~/metadata/forms/elements/inputField/importFromXML"
import { ChildItemsFixture, childItemsFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importChildItemsFromXML } from "./importFromXML"
import { ChildItemsXML } from "./types"

describe("importChildItemsFromXML", () => {
  it.each(
    childItemsFixturesTable.filter((fixture) => fixture.xmlPath) as Array<ChildItemsFixture & { xmlPath: string }>
  )("$name", ({ element, xmlPath }) => {
    const xmlData = readAndParseXMLFile<{ ChildItems: ChildItemsXML }>(xmlPath)

    const result = importChildItemsFromXML(mockСontext, xmlData.ChildItems)

    expect(result).toEqual(element)
  })
})
