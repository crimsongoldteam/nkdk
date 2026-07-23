import { describe, expect, it } from "vitest"
import type { DcsMetadataValuePropertyRule } from "../dataCompositionSystem/dcsMetadataValue/types"
import type { PropertyRule } from "../../orchestration"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { dcsTypeLink } from "./__fixtures__/data"

const rule = {
  type: "MetadataDcsMetadataValue",
  valueType: "TypeLink",
  yaml: "value",
} satisfies DcsMetadataValuePropertyRule

describe("export TypeLink to DCS XML", () => {
  it("exports dcs/typeLink.xml", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule: rule as PropertyRule,
      value: dcsTypeLink,
      xmlRootTag: "dcscor:value",
      path: "dcs/typeLink.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
