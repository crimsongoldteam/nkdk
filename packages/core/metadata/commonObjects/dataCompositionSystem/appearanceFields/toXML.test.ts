import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fixtureAppearanceFields, fixtureAppearanceRule } from "./__fixtures__/data"

describe("export Appearance to XML", () => {
  it("should export appearance.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule: fixtureAppearanceRule,
      value: fixtureAppearanceFields,
      xmlRootTag: "dcsset:appearance",
      path: "appearance.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
