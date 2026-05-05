import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import {
  fullConditionalAppearance,
  minimalConditionalAppearance,
  minimalUserSettingsConditionalAppearance,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearance",
}

describe("export ConditionalAppearance to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: fullConditionalAppearance,
      xmlRootTag: "dcsset:conditionalAppearance",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports minimal.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: minimalConditionalAppearance,
      xmlRootTag: "dcsset:conditionalAppearance",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports minimalUserSettings.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: minimalUserSettingsConditionalAppearance,
      xmlRootTag: "dcsset:conditionalAppearance",
      path: "minimalUserSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
