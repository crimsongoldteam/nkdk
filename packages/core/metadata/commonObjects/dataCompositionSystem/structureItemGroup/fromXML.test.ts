import { describe, expect, it } from "vitest"
import { createLocalIndexesCollector } from "../../../project/localIndexes"
import { getTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { testFixturesDir } from "../../../../tests/testFixturesDir"
import {
  fixtureDynamicListStructureItemGroup,
  fixtureDynamicListStructureItemGroupYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "StructureItemGroup",
}

describe("import StructureItemGroup from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "dynamicList.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fixtureDynamicListStructureItemGroup)
  })

  it("напрямую строит плоский YAML-массив", () => {
    const direct = getTypeRule("StructureItemGroup", "importFromXMLToYAML")
    if (direct === undefined) throw new Error("StructureItemGroup direct converter is not registered")
    const xml = readAndParseXMLFile<Record<string, unknown>>(
      "dynamicList.xml",
      testFixturesDir(import.meta.url)
    )["dcsset:item"]
    const result = direct({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      rule,
      xml,
      traversal: { yamlPath: [], rulePath: [], collector: createLocalIndexesCollector() },
    })

    expect(result).toEqual(fixtureDynamicListStructureItemGroupYAML)
  })
})
