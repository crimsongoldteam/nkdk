import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { accountingExtDimensions, all, allYAML, multiple } from "./__fixtures__/data"
import { fillValueEmptyRefTypeLoss } from "./__fixtures__/fillValueEmptyRefTypeLoss"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { testFixturesDir } from "../../../tests/testFixturesDir"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { StandartAttributeNameToYAML } from "./types"

const rule: PropertyRule = {
  type: "StandardAttributeDescriptions",
  yaml: "СтандартныеРеквизиты",
  standartAttributeNames: StandartAttributeNameToYAML,
}

const accountingRule = {
  type: "StandardAttributeDescriptions",
  standartAttributeNames: {},
} satisfies PropertyRule

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

  it("imports explicit accounting ExtDimension standard attributes", () => {
    const result = testImportPropertyFromXML({
      rule: accountingRule,
      path: "accounting-ext-dimensions.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(accountingExtDimensions)
  })

  it("imports all.xml directly to YAML", () => {
    const direct = getTypeRule("StandardAttributeDescriptions", "importFromXMLToYAML")
    if (direct === undefined) throw new Error("StandardAttributeDescriptions direct converter is not registered")
    const fixtureXML = readAndParseXMLFile<Record<string, unknown>>("all.xml", testFixturesDir(import.meta.url))
      .StandardAttributes

    expect(
      direct({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule,
        xml: fixtureXML,
        traversal: {
          yamlPath: ["СтандартныеРеквизиты"],
          rulePath: [{ propertyKey: "standardAttributes" }],
          collector: createLocalIndexesCollector(),
        },
      })
    ).toEqual(allYAML)
  })
})
