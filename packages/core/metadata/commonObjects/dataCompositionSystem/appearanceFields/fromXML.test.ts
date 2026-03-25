import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fixtureAppearanceFields } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "Appearance",
}

describe("import Appearance from XML", () => {
  it("should import appearance.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "appearance.xml",
      xmlRootTag: "dcsset:appearance",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fixtureAppearanceFields)
  })
})
