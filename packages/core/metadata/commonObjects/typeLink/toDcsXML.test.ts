import { describe, expect, it } from "vitest"
import { dcsTypeLink } from "./__fixtures__/data"
import type { DcsMetadataValuePropertyRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types"
import type { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = {
  type: "MetadataDcsMetadataValue",
  valueType: "TypeLink",
  yaml: "value",
} satisfies DcsMetadataValuePropertyRule

describe("export TypeLink to DCS XML", () => {
  it("exports dcs/typeLink-wrapped.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule: rule as PropertyRule,
      value: dcsTypeLink,
      xmlRootTag: "root",
      path: "dcs/typeLink-wrapped.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
