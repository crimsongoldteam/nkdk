import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { dataParametersFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DataParameters",
}

describe("import DataParameters from XML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(dataParametersFixture)
  })
})
