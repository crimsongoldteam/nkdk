import { describe, expect, it, vi } from "vitest"

import { defineMetadataRules } from "../definition"
import { emptyMetadataRules } from "../definition/testSupport"
import type { ImportFromXMLFunction } from "./fn"
import type { MetadataItemRule } from "./types"
import { createPropertyRuleExecutor } from "./propertyRuleExecutor"
import { createPropertyRuleRegistrySet } from "./propertyRuleRegistrySet"
import { getXMLImportPlan, visitXMLImportPlan } from "./xmlImportPlan"

const ownerValueRule = (type = "Sample"): MetadataItemRule => ({
  itemType: "Owner",
  properties: {
    value: { type, yaml: "Значение", xml: "Value" },
  },
})

const registriesWithImport = (handler: ImportFromXMLFunction) =>
  createPropertyRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: { Sample: { importFromXML: handler } },
  }))

describe("CompiledPropertyPlan", () => {
  it("кэширует оба направления в одном плане и инвалидирует revision", () => {
    const firstImport = vi.fn<ImportFromXMLFunction>((_context, _rule, value) => value)
    const registries = registriesWithImport(firstImport)
    const execution = createPropertyRuleExecutor(registries)
    const rule = ownerValueRule()

    const first = execution.propertyPlan(rule)

    expect(execution.propertyPlan(rule)).toBe(first)
    expect(first.yamlToXMLOrder.map(({ propertyKey }) => propertyKey)).toEqual(["value"])
    expect(first.xmlImportView({ includeAllTags: true }).entriesByPropertyKey.get("value"))
      .toBe(first.propertiesByKey.get("value"))
    expect(first.propertiesByKey.get("value")?.operations.importFromXML).toBe(firstImport)
    expect(Object.keys(first).sort()).toEqual([
      "properties",
      "propertiesByKey",
      "registryRevision",
      "rule",
      "xmlImportView",
      "yamlToXMLOrder",
    ].sort())

    registries.registerTypeRule("Sample", "importFromXML", () => "second")
    const second = execution.propertyPlan(rule)

    expect(second).not.toBe(first)
    expect(second.registryRevision).toBe(first.registryRevision + 1)
  })

  it("не разделяет планы одного rule между executor", () => {
    const rule = ownerValueRule()
    const firstImport = () => "first"
    const secondImport = () => "second"
    const first = createPropertyRuleExecutor(registriesWithImport(firstImport)).propertyPlan(rule)
    const second = createPropertyRuleExecutor(registriesWithImport(secondImport)).propertyPlan(rule)

    expect(second).not.toBe(first)
    expect(first.propertiesByKey.get("value")?.operations.importFromXML).toBe(firstImport)
    expect(second.propertiesByKey.get("value")?.operations.importFromXML).toBe(secondImport)
  })

  it("сохраняет варианты tag внутри одного плана", () => {
    const rule: MetadataItemRule = {
      itemType: "TaggedOwner",
      properties: {
        body: { type: "Sample", xml: "Value", tag: "Body" },
        metadata: { type: "Sample", xml: "Value", tag: "Metadata" },
      },
    }
    const plan = createPropertyRuleExecutor(registriesWithImport(() => undefined)).propertyPlan(rule)

    expect(plan.xmlImportView({ tags: ["Body"], includeAllTags: false }))
      .toBe(plan.xmlImportView({ tags: ["Body"], includeAllTags: false }))
    expect([...plan.xmlImportView({ tags: ["Body"], includeAllTags: false }).entriesByPropertyKey.keys()])
      .toEqual(["body"])
    expect([...plan.xmlImportView({ tags: ["Metadata"], includeAllTags: false }).entriesByPropertyKey.keys()])
      .toEqual(["metadata"])
  })

  it("обходит canonical, alias и xmlParents так же, как прежний XML-план", () => {
    const rule: MetadataItemRule = {
      itemType: "StructuralOwner",
      properties: {
        name: { type: "Sample", xml: "Name", xmlAliases: ["LegacyName"] },
        appearance: { type: "Sample", xml: "Appearance", xmlParents: ["Attributes"] },
      },
    }
    const execution = createPropertyRuleExecutor(registriesWithImport(() => undefined))
    const xml = { LegacyName: "name", Attributes: { Appearance: "appearance" } }
    const collect = (plan: ReturnType<typeof getXMLImportPlan>) => {
      const matches: unknown[] = []
      visitXMLImportPlan({
        plan,
        xml,
        visit: (match) => matches.push([match.propertyKey, match.xmlPath, match.xmlValue]),
      })
      return matches
    }

    expect(collect(execution.propertyPlan(rule).xmlImportView({ includeAllTags: true })))
      .toEqual(collect(getXMLImportPlan({ rule, includeAllTags: true })))
  })

  it("добавляет координаты свойства к ошибке компиляции операции", () => {
    const registries = registriesWithImport(() => undefined)
    const original = registries.getTypeRule.bind(registries)
    vi.spyOn(registries, "getTypeRule").mockImplementation((type, operation) => {
      if (operation === "exportToYAML") throw new Error("probe")
      return original(type, operation)
    })

    expect(() => createPropertyRuleExecutor(registries).propertyPlan(ownerValueRule()))
      .toThrow("Owner.value (Sample), операция exportToYAML: probe")
  })
})
