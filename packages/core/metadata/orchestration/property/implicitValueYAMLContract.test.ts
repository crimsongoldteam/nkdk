import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import type { MetadataItemRule, PropertyRule } from "./types"

type RuleModule = Record<string, unknown>

const ruleModules = import.meta.glob<RuleModule>("../../**/rules.ts", { eager: true })

describe("implicitValueYAML contract", () => {
  it("accepts explicit noImplicitValueYAML for boolean and SystemEnumeration YAML properties", () => {
    const rule = {
      itemType: "MetadataConfiguration",
      properties: {
        flag: { type: "boolean", yaml: "Флаг", noImplicitValueYAML: true },
        mode: { type: "SystemEnumeration", typeSE: "ModalityUseMode", yaml: "Режим", noImplicitValueYAML: true },
      },
    } as const satisfies MetadataItemRule

    expect(collectMissingImplicitValueYAML(rule, "TestRules")).toEqual([])
  })

  it("requires configuration boolean and SystemEnumeration YAML properties to document implicit value decision", () => {
    expect(collectMissingImplicitValueYAML(MetadataConfigurationRules, "MetadataConfigurationRules")).toEqual([])
  })

  it("requires catalog boolean and SystemEnumeration YAML properties to document implicit value decision", () => {
    expect(collectMissingImplicitValueYAML(MetadataCatalogRules, "MetadataCatalogRules")).toEqual([])
  })

  it("requires boolean and SystemEnumeration YAML properties with defaultValueXML to have implicitValueYAML", () => {
    const missing = collectRules().flatMap(({ exportName, rule }) =>
      collectMissingImplicitValueYAMLForXMLDefault(rule, exportName)
    )

    expect(missing).toEqual([])
  })
})

function collectRules(): Array<{ exportName: string; rule: MetadataItemRule }> {
  return Object.values(ruleModules).flatMap((module) =>
    Object.entries(module)
      .filter(([exportName, value]) => exportName.endsWith("Rules") && isMetadataItemRule(value))
      .map(([exportName, rule]) => ({ exportName, rule }))
  )
}

function collectMissingImplicitValueYAML(rule: MetadataItemRule, path: string): string[] {
  const propertyMissing = Object.entries(rule.properties)
    .filter(([, propertyRule]) => needsImplicitValueDecision(propertyRule))
    .map(([key]) => `${path}.${key}`)

  const childMissing =
    rule.childCollections?.flatMap(({ propertyKey, itemRule }) =>
      collectMissingImplicitValueYAML(itemRule, `${path}.${propertyKey}`)
    ) ?? []

  return [...propertyMissing, ...childMissing]
}

function collectMissingImplicitValueYAMLForXMLDefault(rule: MetadataItemRule, path: string): string[] {
  const propertyMissing = Object.entries(rule.properties)
    .filter(([, propertyRule]) => needsImplicitValueForXMLDefault(propertyRule))
    .map(([key]) => `${path}.${key}`)

  const childMissing =
    rule.childCollections?.flatMap(({ propertyKey, itemRule }) =>
      collectMissingImplicitValueYAMLForXMLDefault(itemRule, `${path}.${propertyKey}`)
    ) ?? []

  return [...propertyMissing, ...childMissing]
}

function needsImplicitValueDecision(rule: PropertyRule): boolean {
  if (rule.type !== "boolean" && rule.type !== "SystemEnumeration") return false
  if (!rule.yaml) return false
  if (rule.runtimeOnly === true || rule.syncExternalOnly === true) return false
  if (rule.toYAML === false && rule.fromYAML === false) return false
  if ("implicitValueYAML" in rule) return false
  if ("noImplicitValueYAML" in rule) return false
  return true
}

function needsImplicitValueForXMLDefault(rule: PropertyRule): boolean {
  if (rule.type !== "boolean" && rule.type !== "SystemEnumeration") return false
  if (!rule.yaml) return false
  if (!("defaultValueXML" in rule)) return false
  if ("implicitValueYAML" in rule) return false
  if ("noImplicitValueYAML" in rule) return false
  return true
}

function isMetadataItemRule(value: unknown): value is MetadataItemRule {
  if (value === null || typeof value !== "object") return false
  const candidate = value as Partial<MetadataItemRule>
  return typeof candidate.itemType === "string" && candidate.properties !== undefined
}
