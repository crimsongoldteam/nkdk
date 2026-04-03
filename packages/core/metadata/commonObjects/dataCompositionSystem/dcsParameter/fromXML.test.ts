import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullDCSParameters, minimalDCSParameters } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DCSParameter" }

describe("import DCSParameter from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      importMetaUrl: import.meta.url,
      xmlRootTag: "Settings",
    })
    expect(result).toEqual(fullDCSParameters)
  })

  it("imports minimal.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
      xmlRootTag: "Settings",
    })
    expect(result).toEqual(minimalDCSParameters)
  })
})
