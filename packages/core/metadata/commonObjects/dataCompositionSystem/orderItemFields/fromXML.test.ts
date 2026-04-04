import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { dcsOrderItemFieldsFixture } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = {
  type: "OrderItemFields",
}

describe("import OrderItemFields from XML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:order",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(dcsOrderItemFieldsFixture)
  })
})
