import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "../../../../../../tests/property/importPropertyFromXML"
import { fixtureGroupItemAuto, fixtureGroupItemAutoUseFalse } from "./__fixtures__/data"

describe("import GroupItemAuto from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule: { type: "GroupItemAuto" },
      path: "dynamicList.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fixtureGroupItemAuto)
  })

  it("imports fullUseFalse.xml", () => {
    const result = testImportPropertyFromXML({
      rule: { type: "GroupItemAuto" },
      path: "dynamicListUseFalse.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fixtureGroupItemAutoUseFalse)
  })
})
