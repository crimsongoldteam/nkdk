import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import { dcsOrderItemFieldsFixture } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = { type: "OrderItemFields", xml: "dcsset:item" } as const

describe("export OrderItemFields to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: dcsOrderItemFieldsFixture,
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
