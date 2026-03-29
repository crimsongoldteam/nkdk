import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { fullExtendedTooltip } from "~/metadata/forms/elements/extendedTooltip/__fixtures__/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule: PropertyRule = { type: "ExtendedTooltip" }

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "ExtendedTooltip",
      path: "defaults.xml",
      importMetaUrl: import.meta.url,
      itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
    })

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullExtendedTooltip,
      xmlRootTag: "ExtendedTooltip",
      path: "full.xml",
      importMetaUrl: import.meta.url,
      itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
    })

    expect(result).toEqual(expectedResult)
  })
})
