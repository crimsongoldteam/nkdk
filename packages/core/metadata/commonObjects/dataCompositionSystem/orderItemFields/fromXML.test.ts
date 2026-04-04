import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { dcsOrderItemFieldsFixture } from "./__fixtures__/data"
import "./index"

const rule = { type: "OrderItemFields" } as const

describe("import OrderItemFields from XML", () => {
  it("imports asc.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "asc.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([dcsOrderItemFieldsFixture[0]])
  })

  it("imports desc.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "desc.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([dcsOrderItemFieldsFixture[1]])
  })
})
