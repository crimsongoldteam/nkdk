import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { testFixturesDir } from "../../../../tests/testFixturesDir"
import { createLocalIndexesCollector } from "../../../project/localIndexes"
import { getTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { dcsOrderItemFieldsFixture, dcsOrderItemFieldsYAMLFixture } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = {
  type: "OrderItemFields",
  xml: "dcsset:item",
  yaml: "Порядок",
}

describe("import OrderItemFields from XML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(dcsOrderItemFieldsFixture)
  })

  it("imports full fixture directly to YAML", () => {
    const direct = getTypeRule("OrderItemFields", "importFromXMLToYAML")
    if (direct === undefined) throw new Error("OrderItemFields direct converter is not registered")
    const fixtureXML = readAndParseXMLFile<Record<string, unknown>>("full.xml", testFixturesDir(import.meta.url))

    expect(
      direct({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule,
        xml: fixtureXML,
        traversal: {
          yamlPath: ["Порядок"],
          rulePath: [{ propertyKey: "fields" }],
          collector: createLocalIndexesCollector(),
        },
      })
    ).toEqual(dcsOrderItemFieldsYAMLFixture)
  })
})
