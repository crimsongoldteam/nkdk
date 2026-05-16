import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { autoOrderFixture, orderFixture } from "./__fixtures__/data"

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

  it("imports auto item from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "auto.xml",
      xmlRootTag: "dcsset:order",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(autoOrderFixture)
  })
})
