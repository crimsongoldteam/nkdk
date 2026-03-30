import { describe, expect, it } from "vitest"
import type { DcsMetadataValuePropertyRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types"
import type { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { dcsTypeLink } from "./__fixtures__/data"

const rule = {
  type: "MetadataDcsMetadataValue",
  valueType: "TypeLink",
  yaml: "value",
} satisfies DcsMetadataValuePropertyRule

describe("export TypeLink to DCS XML", () => {
  it("exports dcs/typeLink.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule: rule as PropertyRule,
      value: dcsTypeLink,
      xmlRootTag: "dcscor:value",
      path: "dcs/typeLink.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
