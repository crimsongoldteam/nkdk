import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ChildItemsFixture, childItemsFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importChildItemsFromXML } from "./importFromXML"
import { ChildItemsXML } from "./types"

describe("importChildItemsFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importChildItemsFromXML(mockСontext, undefined)

    expect(result).toEqual([])
  })

  it.each(
    childItemsFixturesTable.filter((fixture) => fixture.xmlPath) as Array<ChildItemsFixture & { xmlPath: string }>
  )("$name", ({ element, xmlPath }) => {
    const xmlData = readAndParseXMLFile<{ ChildItems: ChildItemsXML }>(xmlPath)

    const result = importChildItemsFromXML(mockСontext, xmlData.ChildItems)

    expect(result).toEqual(element)
  })

  it("should throw error when import function not found", () => {
    const xmlData = {
      ChildItems: [{ InvalidElement: { name: "InvalidElement", elementType: FormElementType.Button } }] as any,
    }

    expect(() => importChildItemsFromXML(mockСontext, xmlData.ChildItems)).toThrow(
      "ImportFromXML function not found for element type: InvalidElement"
    )
  })
})
