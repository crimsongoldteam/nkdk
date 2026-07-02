import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { typedDateTimeRule, typedDateTimeValue } from "./__fixtures__/data"

describe("importDateTimeFromXML", () => {
  it("imports typed dateTime from XML", () => {
    const result = testImportPropertyFromXML({
      rule: typedDateTimeRule,
      path: "typed.xml",
      xmlRootTag: "MinValue",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(typedDateTimeValue)
  })
})
