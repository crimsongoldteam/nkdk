import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { typedDateTimeRule, typedDateTimeValue } from "./__fixtures__/data"

describe("exportDateTimeToXML", () => {
  it("exports typed dateTime to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: typedDateTimeRule,
      value: typedDateTimeValue,
      xmlRootTag: "MinValue",
      path: "typed.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
