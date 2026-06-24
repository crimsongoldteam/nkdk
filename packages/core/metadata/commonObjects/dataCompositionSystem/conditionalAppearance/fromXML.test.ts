import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import {
  fullConditionalAppearance,
  minimalConditionalAppearance,
  minimalUserSettingsConditionalAppearance,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearance",
}

describe("import ConditionalAppearance from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:conditionalAppearance",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullConditionalAppearance)
  })

  it("imports minimal.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "dcsset:conditionalAppearance",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(minimalConditionalAppearance)
  })

  it("imports minimalUserSettings.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimalUserSettings.xml",
      xmlRootTag: "dcsset:conditionalAppearance",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(minimalUserSettingsConditionalAppearance)
  })
})
