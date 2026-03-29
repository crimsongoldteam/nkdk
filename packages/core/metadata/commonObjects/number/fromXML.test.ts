import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { typedNumberRule, typedNumberValue } from "./__fixtures__/data"

describe("importNumberFromXML", () => {
  it("imports typed decimal from XML", () => {
    const result = testImportPropertyFromXML({
      rule: typedNumberRule,
      path: "typed.xml",
      xmlRootTag: "MinValue",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(typedNumberValue)
  })
})
