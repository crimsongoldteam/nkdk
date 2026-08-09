import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { MetadataItemRule, PropertyRule } from "../../ruleRuntime/property/types"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { Diagnostic } from "../../validation/types"
import { diagnosticAtYamlPath, type YamlPath } from "../../validation/yamlLocations"
import { resolveFormElementRule } from "../elements/ruleRuntime/fromYAMLToXML"

export const FORM_ELEMENT_NAMES_PROFILE_SUBSTEP = "Проверка уникальности имён элементов формы"

interface FormElementNameOccurrence {
  name: string
  kind: "explicit" | "reserved"
  path: YamlPath
  ownerName?: string
  propertyName?: string
}

export interface FormElementNameCollector {
  acceptExplicit(params: { name: string; path: YamlPath }): void
  acceptReserved(params: {
    name: string
    path: YamlPath
    ownerName?: string
    propertyName?: string
  }): void
  finish(): Diagnostic[]
}

export function createFormElementNameCollector(params: {
  filePath: string
  parsed: ParsedYaml
}): FormElementNameCollector {
  const occurrences: FormElementNameOccurrence[] = []
  return {
    acceptExplicit: ({ name, path }) => {
      occurrences.push({ name, kind: "explicit", path })
    },
    acceptReserved: ({ name, path, ownerName, propertyName }) => {
      occurrences.push({
        name,
        kind: "reserved",
        path,
        ...(ownerName === undefined ? {} : { ownerName }),
        ...(propertyName === undefined ? {} : { propertyName }),
      })
    },
    finish: () =>
      duplicateNameDiagnostics({
        filePath: params.filePath,
        parsed: params.parsed,
        occurrences,
      }),
  }
}

export function validateFormElementNames(params: {
  filePath: string
  parsed: ParsedYaml
  value: unknown
  yamlPath: YamlPath
  rule: MetadataItemRule
}): Diagnostic[] {
  const yaml = asRecord(params.value)
  if (yaml === undefined) return []

  const collector = createFormElementNameCollector(params)
  collectOwnerElementNames({
    yaml,
    rule: params.rule,
    ownerPath: params.yamlPath,
    collector,
    singletonRuleStack: new Set(),
  })

  return collector.finish()
}

function collectOwnerElementNames(params: {
  yaml: Record<string, unknown>
  rule: MetadataItemRule
  ownerName?: string
  ownerPath: YamlPath
  collector: FormElementNameCollector
  singletonRuleStack: ReadonlySet<string>
}): void {
  for (const propertyRule of Object.values(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string" || typeof propertyRule.type !== "string") continue

    const nestedItemRule = getTypeRule(propertyRule.type, "nestedItemRule")
    if (nestedItemRule === undefined) continue

    const identity = getTypeRule(propertyRule.type, "nestedItemIdentity")
    if (identity !== undefined && "itemRule" in nestedItemRule) {
      const name = identity.resolveName(params.ownerName)
      if (name === undefined || name.length === 0) continue

      params.collector.acceptReserved({
        name,
        path: params.ownerPath,
        ...(params.ownerName === undefined ? {} : { ownerName: params.ownerName }),
        propertyName: propertyRule.yaml,
      })

      if (params.singletonRuleStack.has(nestedItemRule.itemRule.itemType)) continue
      const value = asRecord(params.yaml[propertyRule.yaml])
      const singletonRuleStack = new Set(params.singletonRuleStack)
      singletonRuleStack.add(nestedItemRule.itemRule.itemType)
      collectOwnerElementNames({
        yaml: value ?? {},
        rule: nestedItemRule.itemRule,
        ownerName: name,
        ownerPath: value === undefined ? params.ownerPath : [...params.ownerPath, propertyRule.yaml],
        collector: params.collector,
        singletonRuleStack,
      })
      continue
    }

    if (!("resolveItemRule" in nestedItemRule)) continue
    collectExplicitElementNames({
      yaml: params.yaml,
      propertyRule,
      ownerPath: params.ownerPath,
      collector: params.collector,
      singletonRuleStack: params.singletonRuleStack,
    })
  }
}

function collectExplicitElementNames(params: {
  yaml: Record<string, unknown>
  propertyRule: PropertyRule
  ownerPath: YamlPath
  collector: FormElementNameCollector
  singletonRuleStack: ReadonlySet<string>
}): void {
  if (typeof params.propertyRule.yaml !== "string") return
  const elements = asRecord(params.yaml[params.propertyRule.yaml])
  if (elements === undefined) return

  for (const [name, value] of Object.entries(elements)) {
    const element = asRecord(value)
    if (element === undefined) continue
    const path = [...params.ownerPath, params.propertyRule.yaml, name]
    params.collector.acceptExplicit({ name, path })

    let rule: MetadataItemRule
    try {
      rule = resolveFormElementRule({
        yaml: element,
        name,
        propertyRule: params.propertyRule,
      })
    } catch {
      continue
    }

    collectOwnerElementNames({
      yaml: element,
      rule,
      ownerName: name,
      ownerPath: path,
      collector: params.collector,
      singletonRuleStack: params.singletonRuleStack,
    })
  }
}

function duplicateNameDiagnostics(params: {
  filePath: string
  parsed: ParsedYaml
  occurrences: readonly FormElementNameOccurrence[]
}): Diagnostic[] {
  const groups = new Map<string, FormElementNameOccurrence[]>()
  for (const occurrence of params.occurrences) {
    const key = occurrence.name.toLowerCase()
    const group = groups.get(key)
    if (group === undefined) groups.set(key, [occurrence])
    else group.push(occurrence)
  }

  const diagnostics: Diagnostic[] = []
  for (const group of groups.values()) {
    if (group.length < 2) continue

    const explicit = group.filter((occurrence) => occurrence.kind === "explicit")
    const reserved = group.filter((occurrence) => occurrence.kind === "reserved")
    if (explicit.length > 0 && reserved.length > 0) {
      const source = reserved[0]!
      for (const occurrence of explicit) {
        diagnostics.push(
          createDuplicateDiagnostic({
            ...params,
            occurrence,
            message: reservedConflictMessage(occurrence, source),
          })
        )
      }
      continue
    }

    const duplicates = explicit.length > 0 ? explicit.slice(1) : reserved.slice(1)
    for (const occurrence of duplicates) {
      diagnostics.push(
        createDuplicateDiagnostic({
          ...params,
          occurrence,
          message: `Имя элемента формы "${occurrence.name}" должно быть уникальным в пределах формы`,
        })
      )
    }
  }
  return diagnostics
}

function reservedConflictMessage(
  explicit: FormElementNameOccurrence,
  reserved: FormElementNameOccurrence
): string {
  const source =
    reserved.ownerName === undefined
      ? `зарезервированным single-элементом "${reserved.name}"`
      : `single-элементом "${reserved.propertyName ?? reserved.name}" элемента "${reserved.ownerName}"`
  return `Имя элемента формы "${explicit.name}" занято ${source}`
}

function createDuplicateDiagnostic(params: {
  filePath: string
  parsed: ParsedYaml
  occurrence: FormElementNameOccurrence
  message: string
}): Diagnostic {
  return diagnosticAtYamlPath({
    filePath: params.filePath,
    parsed: params.parsed,
    path: params.occurrence.path,
    severity: "error",
    source: "structure",
    message: params.message,
  })
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
