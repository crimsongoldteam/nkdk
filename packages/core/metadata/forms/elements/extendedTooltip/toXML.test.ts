import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { testExportPropertyToXML } from "~/tests/exportElementToXML"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"

const rule: PropertyRule = { type: "ExtendedTooltip" }

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "ExtendedTooltip",
      path: "forms/extendedTooltip/defaults.xml",
      itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
    })

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullExtendedTooltip,
      xmlRootTag: "ExtendedTooltip",
      path: "forms/extendedTooltip/full.xml",
      itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
    })

    expect(result).toEqual(expectedResult)
  })
})
