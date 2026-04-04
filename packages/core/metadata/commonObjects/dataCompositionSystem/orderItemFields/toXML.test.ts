import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { dcsOrderItemFieldsFixture } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = { type: "OrderItemFields" } as const

describe("export OrderItemFields to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: dcsOrderItemFieldsFixture,
      xmlRootTag: "dcsset:order",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
