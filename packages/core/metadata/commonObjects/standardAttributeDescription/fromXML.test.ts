import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { all, multiple } from "~/metadata/commonObjects/standardAttributeDescription/__fixtures__/data"
import { fillValueEmptyRefTypeLoss } from "~/metadata/commonObjects/standardAttributeDescription/__fixtures__/fillValueEmptyRefTypeLoss"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { StandartAttributeNameToYAML } from "./types"

const rule: PropertyRule = {
  type: "StandardAttributeDescriptions",
  standartAttributeNames: StandartAttributeNameToYAML,
}

describe("import StandardAttributeDescriptions from XML", () => {
  it("should import all parameters", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "all.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(all)
  })

  it("should return undefined when only name is present", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })
    expect(result).toBeUndefined()
  })

  it("should return undefined when all values are defaults", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "default.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })
    expect(result).toBeUndefined()
  })

  it("should import with multiple values", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "multiple.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(multiple)
  })

  it("import fillValueEmptyRefTypeLoss", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "fillValueEmptyRefTypeLoss.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(fillValueEmptyRefTypeLoss)
  })
})
