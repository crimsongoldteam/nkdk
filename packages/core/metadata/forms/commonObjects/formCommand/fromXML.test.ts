import { describe, expect, it } from "vitest"
import { fullFormCommands, fullFormCommandsYAML, minimalFormCommandsFromXML } from "./__fixtures__/data"
import { importPropertyFromXML, PropertyRule } from "../../../orchestration"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { createLocalIndexesCollector } from "../../../project/localIndexes"
import { getTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { testFixturesDir } from "../../../../tests/testFixturesDir"

import "./types"

const rule: PropertyRule = {
  type: "FormCommands",
  yaml: "Команды",
  defaultValue: [],
}

describe("import FormCommands from XML", () => {
  it("should return empty array for undefined input", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: undefined,
    })

    expect(result).toEqual([])
  })

  it("should import full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Commands",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullFormCommands)
  })

  it("should import minimal.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "Commands",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(minimalFormCommandsFromXML)
  })

  it("imports full.xml directly to YAML", () => {
    const direct = getTypeRule("FormCommands", "importFromXMLToYAML")
    if (direct === undefined) throw new Error("FormCommands direct converter is not registered")
    const fixtureXML = readAndParseXMLFile<Record<string, unknown>>("full.xml", testFixturesDir(import.meta.url)).Commands

    expect(
      direct({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule,
        xml: fixtureXML,
        traversal: {
          yamlPath: ["Команды"],
          rulePath: [{ propertyKey: "commands" }],
          collector: createLocalIndexesCollector(),
        },
      })
    ).toEqual(fullFormCommandsYAML)
  })
})
