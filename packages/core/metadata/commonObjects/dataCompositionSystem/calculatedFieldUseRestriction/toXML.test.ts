import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fullUseRestriction } from "./__fixtures__/data"
import "./types"

describe("export CalculatedFieldUseRestriction to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "CalculatedFieldUseRestriction" },
      value: fullUseRestriction,
      xmlRootTag: "dcssch:useRestriction",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
