import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullAvailableFields } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("import available fields from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:selection",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullAvailableFields)
  })
})
