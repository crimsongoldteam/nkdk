import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullOrderExpressions } from "./__fixtures__/data"
import "./types"

describe("import CalculatedFieldOrderExpression from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      path: "full.xml",
      xmlRootTag: "dcssch:orderExpression",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullOrderExpressions)
  })
})
