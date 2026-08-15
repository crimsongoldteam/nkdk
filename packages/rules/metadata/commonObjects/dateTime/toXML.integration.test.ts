import { describe, expect, it } from "vitest"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { typedDateTimeRule, typedDateTimeValue } from "./__fixtures__/data"

describe("exportDateTimeToXML", () => {
  it("exports typed dateTime to XML", () => {
    const { result, expectedResult } = testAtomicToXML({
      rule: typedDateTimeRule,
      value: typedDateTimeValue,
      xmlRootTag: "MinValue",
      path: "typed.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
