import { describe, expect, it } from "vitest"
import {
  accountingRegisterStandardAttributeTypeLink,
  catalogTabularAttributeTypeLink,
} from "./__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule: PropertyRule = {
  type: "TypeLink",
}

describe("import TypeLink from XML", () => {
  it("imports simple.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "simple.xml",
      xmlRootTag: "TypeLink",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(catalogTabularAttributeTypeLink)
  })

  it("imports withNumericLinkItem.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "withNumericLinkItem.xml",
      xmlRootTag: "TypeLink",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(accountingRegisterStandardAttributeTypeLink)
  })
})
