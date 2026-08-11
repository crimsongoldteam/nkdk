import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import { defineMetadataItemCollectionRule } from "../ruleRuntime/metadataCollection/ruleFactory"
import { composeMetadataRules, createPropertyRuleRegistrySet, withPropertyRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { collectAddressableRequiredChecks } from "./addressableRequired"

const addressableChildRule = {
  itemType: "RequiredAddressableChild",
  externalMetadata: { segment: "Cube", placement: "ownedEntry" },
  properties: {
    name: { type: "string", yaml: "Имя", required: true },
    requiredValue: { type: "string", yaml: "ОбязательноеПоле", required: true },
  },
} as const satisfies MetadataItemRule

const valueChildRule = {
  itemType: "RequiredValueChild",
  properties: {
    requiredValue: { type: "string", yaml: "ОбязательноеПоле", required: true },
  },
} as const satisfies MetadataItemRule

const requiredRules = createPropertyRuleRegistrySet(composeMetadataRules(defineMetadataItemCollectionRule({
  propertyType: "RequiredAddressableChildren",
  itemRule: addressableChildRule,
  xmlElement: "Cube",
}), defineMetadataItemCollectionRule({
  propertyType: "RequiredValueChildren",
  itemRule: valueChildRule,
  xmlElement: "Value",
})))

const rootRule = {
  itemType: "RequiredRoot",
  properties: {
    requiredRoot: { type: "string", yaml: "ОбязательноеПолеКорня", required: true },
    cubes: { type: "RequiredAddressableChildren", yaml: "Кубы" },
    values: { type: "RequiredValueChildren", yaml: "Значения" },
  },
} as const satisfies MetadataItemRule

describe("collectAddressableRequiredChecks", () => {
  it("defers a missing direct required field of the file target", () => {
    expect(checks("{}\n")).toEqual([
      expect.objectContaining({
        kind: "addressableRequired",
        yamlPath: [],
        canonicalTarget: "ExternalDataSource.Источник",
        missing: ["ОбязательноеПолеКорня"],
      }),
    ])
  })

  it("creates a separate check for an addressable nested item", () => {
    expect(checks("ОбязательноеПолеКорня: Есть\nКубы:\n  НовыйКуб: {}\n")).toEqual([
      {
        kind: "addressableRequired",
        yamlPath: ["Кубы", "НовыйКуб"],
        location: expect.objectContaining({ line: expect.any(Number), col: expect.any(Number) }),
        canonicalTarget: "ExternalDataSource.Источник.Cube.НовыйКуб",
        missing: ["ОбязательноеПоле"],
      },
    ])
  })

  it("does not defer required fields of an ordinary nested value", () => {
    expect(checks("ОбязательноеПолеКорня: Есть\nЗначения:\n  Значение: {}\n")).toEqual([])
  })

  it("keeps an own nested target separate from its borrowed owner", () => {
    expect(checks("Кубы:\n  НовыйКуб: {}\n").map(({ canonicalTarget }) => canonicalTarget)).toEqual([
      "ExternalDataSource.Источник",
      "ExternalDataSource.Источник.Cube.НовыйКуб",
    ])
  })
})

function checks(text: string) {
  const parsed = parseMetadataYaml(text)
  return withPropertyRuleRegistrySet(requiredRules, () => collectAddressableRequiredChecks({
    filePath: "/project/cfe/Расширение/Источник.yaml",
    parsed,
    yaml: parsed.data,
    rule: rootRule,
    canonicalTarget: "ExternalDataSource.Источник",
  }))
}
