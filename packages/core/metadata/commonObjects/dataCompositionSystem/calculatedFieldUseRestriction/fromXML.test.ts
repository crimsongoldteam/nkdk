import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { fullUseRestriction } from "./__fixtures__/data"
import "./types"

describe("import CalculatedFieldUseRestriction from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule: { type: "CalculatedFieldUseRestriction" },
      path: "full.xml",
      xmlRootTag: "dcssch:useRestriction",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullUseRestriction)
  })
})
