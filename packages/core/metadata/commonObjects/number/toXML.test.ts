import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "../../../tests/property/exportPropertyToXML"
import { typedNumberRule, typedNumberValue } from "./__fixtures__/data"

describe("exportNumberToXML", () => {
  it("exports typed decimal to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: typedNumberRule,
      value: typedNumberValue,
      xmlRootTag: "MinValue",
      path: "typed.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
