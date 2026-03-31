import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fixtureDynamicListStructureItemGroupFromXML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "StructureItemGroup",
}

describe("import StructureItemGroup from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "dynamicList.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fixtureDynamicListStructureItemGroupFromXML)
  })
})
