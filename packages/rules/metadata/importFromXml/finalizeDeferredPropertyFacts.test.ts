import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { mockXmlImportContext } from "../../tests/mockContext"
import type { MetadataItemRule, PropertyRuleType } from "@nkdk/runtime/rule-kit"
import { registerTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import { finalizeDeferredPropertyFacts } from "./prepareFacts"
import type { DirectImportPropertyFact } from "./propertyFacts"

describe("finalizeDeferredPropertyFacts", () => {
  it("применяет окончательное значение ко всем проекциям адреса, не копируя соседний факт", () => {
    const type = "SelectedFactFinalization" as PropertyRuleType
    registerTypeRule(type, "finalizeImportedYAML", () => "окончательное")
    registerTypeRule(type, "requiresImportedYAMLFinalization", () => true)
    const rule: MetadataItemRule = { itemType: "Dependent", properties: {
      value: { type, yaml: "Значение" }, other: { type: "string", yaml: "Сосед" },
    } }
    const facts: readonly DirectImportPropertyFact[] = [
      { itemType: rule.itemType, itemRule: rule, propertyKey: "value", yamlPath: ["Значение"], value: "исходное" },
      { itemType: rule.itemType, propertyKey: "$container:value", yamlPath: ["Значение"], value: "исходное" },
      { itemType: rule.itemType, itemRule: rule, propertyKey: "other", yamlPath: ["Сосед"], value: "соседнее" },
    ]
    const result = finalizeDeferredPropertyFacts({
      facts, deferred: [], rootRule: rule, context: mockXmlImportContext(), formDataPathIndex: undefined,
    })
    expect(result.map(fact => fact.value)).toEqual(["окончательное", "окончательное", "соседнее"])
    expect(result[2]).toBe(facts[2])
    expect(facts.map(fact => fact.value)).toEqual(["исходное", "исходное", "соседнее"])
  })

  it("не читает адреса и значения независимых фактов и возвращает исходный массив", () => {
    const rule: MetadataItemRule = { itemType: "Independent", properties: {
      text: { type: "string", yaml: "Текст" },
    } }
    const facts: readonly DirectImportPropertyFact[] = [{
      itemType: rule.itemType,
      itemRule: rule,
      propertyKey: "text",
      get yamlPath(): never { throw new Error("unnecessary path read") },
      get value(): never { throw new Error("unnecessary value read") },
    }]
    const result = finalizeDeferredPropertyFacts({
      facts, deferred: [], rootRule: rule, context: mockXmlImportContext(), formDataPathIndex: undefined,
    })
    expect(result).toBe(facts)
  })
})
