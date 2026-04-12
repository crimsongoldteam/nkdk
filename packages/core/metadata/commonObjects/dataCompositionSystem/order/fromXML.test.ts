import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { orderFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Order",
}

describe("import Order from XML", () => {
  it("imports full from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:order",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(orderFixture)
  })
})
