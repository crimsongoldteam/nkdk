import { describe, expect, it } from "vitest"
import { ElementXML } from "~/metadata/orchestration/formElement/types"
import { ChildItemsFixture, childItemsFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { NamedElement } from "../../elements/baseElement/types"
import { importChildItemsFromXML, XMLItem } from "./fromXML"

describe("importChildItemsFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importChildItemsFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toEqual([])
  })

  it.each(
    childItemsFixturesTable.filter((fixture) => fixture.xmlPath) as Array<ChildItemsFixture & { xmlPath: string }>
  )("$name", ({ element, xmlPath }) => {
    const xmlData = readAndParseXMLFile<{ ChildItems: ElementXML[] }>(xmlPath)

    const result = importChildItemsFromXML(
      mockContextFromXML(),
      mockRule,
      xmlData.ChildItems as unknown as XMLItem<NamedElement>[]
    )

    expect(result).toEqual(element)
  })
})
