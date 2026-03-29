import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { fullViewStatusAddition } from "~/metadata/forms/elements/viewStatusAddition/__fixtures__/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule: PropertyRule = { type: "ViewStatusAddition" }

describe("exportViewStatusAdditionToXML", () => {
  it("should return default when data is undefined", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "ViewStatusAddition",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
      itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
    })

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullViewStatusAddition,
      xmlRootTag: "ViewStatusAddition",
      path: "full.xml",
      importMetaUrl: import.meta.url,
      itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
    })

    expect(result).toEqual(expectedResult.trimEnd())
  })
})
