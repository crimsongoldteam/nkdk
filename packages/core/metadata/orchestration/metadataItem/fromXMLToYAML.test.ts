import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import { PropertyRuleType } from "../property/registry"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule } from "../property/types"
import { registerMetadataItemRule } from "./ruleFactory"

describe("importMetadataItemFromXMLToYAML", () => {
  it("builds a nested item without returning its model shape", () => {
    const childRule = {
      itemType: "TestChild",
      properties: {
        name: { type: "string", xml: "Name", yaml: "Имя" },
        enabled: { type: "boolean", xml: "Enabled", yaml: "Включено" },
      },
    } as MetadataItemRule
    registerMetadataItemRule({ propertyType: "TestChild" as PropertyRuleType, itemRule: childRule })
    registerTypeRule("TestChild" as PropertyRuleType, "importFromXML", () => {
      throw new Error("legacy import must not run")
    })

    const result = runDirectRule(
      { itemType: "TestOwner", properties: { child: { type: "TestChild", xml: "Child", yaml: "Дочерний" } } },
      { Child: { Name: "A", Enabled: true } }
    )

    expect(result.yaml).toEqual({ Дочерний: { Имя: "A", Включено: "Истина" } })
    expect(result.yaml).not.toHaveProperty("child")
  })
})

function runDirectRule(rule: MetadataItemRule, xml: Record<string, unknown>) {
  const collector = createLocalIndexesCollector()
  const yaml = importPropertiesFromXMLToYAML({
    context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
    rule,
    xml,
    yamlPath: [],
    rulePath: [],
    collector,
  })
  return { yaml, localIndexes: collector.finish() }
}
