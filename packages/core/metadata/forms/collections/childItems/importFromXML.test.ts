import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType } from "~/metadata/metadataFactory/types"
import { ChildItemsFixture, childItemsFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importChildItemsFromXML } from "./importFromXML"

describe("importChildItemsFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importChildItemsFromXML(mockContext, mockRule, undefined)

    expect(result).toEqual([])
  })

  it.each(
    childItemsFixturesTable.filter((fixture) => fixture.xmlPath) as Array<ChildItemsFixture & { xmlPath: string }>
  )("$name", ({ element, xmlPath }) => {
    const xmlData = readAndParseXMLFile<{ ChildItems: ElementXML[] }>(xmlPath)

    const result = importChildItemsFromXML(mockContext, mockRule, xmlData.ChildItems)

    expect(result).toEqual(element)
  })

  it("should throw error when import function not found", () => {
    const xmlData = {
      ChildItems: [{ InvalidElement: { name: "InvalidElement", elementType: FormElementType.Button } }] as any,
    }

    expect(() => importChildItemsFromXML(mockContext, mockRule, xmlData.ChildItems)).toThrow(
      "ImportFromXML function not found for element type: InvalidElement"
    )
  })
})
