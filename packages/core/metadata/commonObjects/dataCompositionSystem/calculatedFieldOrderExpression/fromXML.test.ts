import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { testFixturesDir } from "../../../../tests/testFixturesDir"
import { createLocalIndexesCollector } from "../../../project/localIndexes"
import { getTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { fullOrderExpressions, fullOrderExpressionsYAML } from "./__fixtures__/data"
import "./types"

describe("import CalculatedFieldOrderExpression from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      path: "full.xml",
      xmlRootTag: "dcssch:orderExpression",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullOrderExpressions)
  })

  it("imports full.xml directly to YAML", () => {
    const direct = getTypeRule("CalculatedFieldOrderExpression", "importFromXMLToYAML")
    if (direct === undefined) throw new Error("CalculatedFieldOrderExpression direct converter is not registered")
    const fixtureXML = readAndParseXMLFile<Record<string, unknown>>("full.xml", testFixturesDir(import.meta.url))["dcssch:orderExpression"]

    expect(
      direct({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule: { type: "CalculatedFieldOrderExpression", yaml: "ВыраженияУпорядочивания" },
        xml: fixtureXML,
        traversal: {
          yamlPath: ["ВыраженияУпорядочивания"],
          rulePath: [{ propertyKey: "orderExpressions" }],
          collector: createLocalIndexesCollector(),
        },
      })
    ).toEqual(fullOrderExpressionsYAML)
  })
})
