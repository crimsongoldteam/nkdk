import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fullOrderExpressions } from "./__fixtures__/data"
import "./types"

describe("export CalculatedFieldOrderExpression to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: fullOrderExpressions,
      xmlRootTag: "dcssch:orderExpression",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult!)
  })
})
