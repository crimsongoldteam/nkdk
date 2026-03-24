import { describe, expect, it } from "vitest"
import { fullContextMenu } from "~/metadata/forms/elements/contextMenu/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule: PropertyRule = {
  type: "ContextMenu",
}

describe("exportContextMenuToXML", () => {
  it("should return default when data is undefined", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "ContextMenu",
      path: "forms/contextMenu/minimal.xml",
      itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
    })

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullContextMenu,
      xmlRootTag: "ContextMenu",
      path: "forms/contextMenu/full.xml",
      itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
    })

    expect(result).toEqual(expectedResult)
  })
})
