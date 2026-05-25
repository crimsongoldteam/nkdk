import { StandartAttributeNameToYAML } from "../standardAttributeDescription/standartAttributeNames"
import type { MetadataFieldsRules, MetadataFieldsRulesItem, MetadataMapItem } from "./types"
import {
  MetadataFieldsRulesToYAML,
  MetadataTypeFromYAML,
  MetadataTypeToYAML,
  MetadataTypesRulesFromYAML,
  MetadataTypesRulesToYAML,
  MetadataValuesRulesToYAML,
} from "./types"

const RUNTIME_ROOT_ALIASES: Record<string, string> = {
  ChartOfAccount: "ChartOfAccounts",
  CatalogObject: "Catalog",
  CatalogRef: "Catalog",
  DocumentObject: "Document",
  DocumentRef: "Document",
  ChartOfAccountObject: "ChartOfAccounts",
  ChartOfAccountRef: "ChartOfAccounts",
  ChartOfAccountsObject: "ChartOfAccounts",
  ChartOfAccountsRef: "ChartOfAccounts",
  EnumRef: "Enum",
}

const COMMON_STANDARD_ATTRIBUTE_RULES: MetadataFieldsRules = StandartAttributeNameToYAML

const GRAPH_SEGMENTS_TO_YAML = {
  Form: "Форма",
  Attribute: "Реквизит",
  StandardAttribute: "СтандартныйРеквизит",
  TabularSection: "ТабличнаяЧасть",
  Dimension: "Измерение",
  Resource: "Ресурс",
  AddressingAttribute: "РеквизитАдресации",
  Command: "Команда",
  Element: "Элемент",
  Parameter: "Параметр",
} as const

const GRAPH_SEGMENTS_FROM_YAML = Object.fromEntries(
  Object.entries(GRAPH_SEGMENTS_TO_YAML).map(([key, value]) => [value, key])
) as Record<(typeof GRAPH_SEGMENTS_TO_YAML)[keyof typeof GRAPH_SEGMENTS_TO_YAML], keyof typeof GRAPH_SEGMENTS_TO_YAML>

function isMapItem(rule: MetadataFieldsRulesItem | undefined): rule is MetadataMapItem {
  return typeof rule === "object" && rule !== null
}

function ruleName(rule: MetadataFieldsRulesItem | undefined): string | undefined {
  if (typeof rule === "string") return rule
  if (isMapItem(rule)) return rule.name
  return undefined
}

function findRuleKeyByName(rules: MetadataFieldsRules | undefined, name: string): string | undefined {
  if (!rules) return undefined
  if (name in rules) return name

  for (const [key, rule] of Object.entries(rules)) {
    if (ruleName(rule) === name) return key
  }

  return undefined
}

function childRules(rule: MetadataFieldsRulesItem | undefined, key: string): MetadataFieldsRules | undefined {
  if (key === "StandardAttribute")
    return isMapItem(rule) ? (rule.fields ?? COMMON_STANDARD_ATTRIBUTE_RULES) : COMMON_STANDARD_ATTRIBUTE_RULES
  if (!isMapItem(rule)) return undefined
  return rule.fields
}

function normalizeRuntimeRoot(root: string): string {
  if (RUNTIME_ROOT_ALIASES[root]) return RUNTIME_ROOT_ALIASES[root]
  if (root.endsWith("Object")) return root.slice(0, -"Object".length)
  if (root.endsWith("Ref")) return root.slice(0, -"Ref".length)
  return root
}

function normalizeTypeRoot(root: string): string | undefined {
  if (root in MetadataTypeToYAML) return normalizeRuntimeRoot(root)
  const modelType = MetadataTypeFromYAML[root as keyof typeof MetadataTypeFromYAML]
  return modelType ? normalizeRuntimeRoot(modelType) : undefined
}

function isRuntimeRootSegment(segment: string): boolean {
  const modelType =
    segment in MetadataTypeToYAML ? segment : MetadataTypeFromYAML[segment as keyof typeof MetadataTypeFromYAML]
  return Boolean(modelType && (modelType.endsWith("Object") || modelType.endsWith("Ref")))
}

function normalizeRootSegment(segment: string, rootRules: MetadataFieldsRules): string {
  const metadataRuleKey = findRuleKeyByName(rootRules, segment)
  if (metadataRuleKey) return normalizeRuntimeRoot(metadataRuleKey)

  const metadataTypeRoot = normalizeTypeRoot(segment)
  if (metadataTypeRoot) return metadataTypeRoot

  const yamlTypeRuleValue = ruleName(MetadataTypesRulesFromYAML[segment])
  if (yamlTypeRuleValue) return normalizeRuntimeRoot(yamlTypeRuleValue)

  if (segment in MetadataTypesRulesToYAML) return normalizeRuntimeRoot(segment)

  return normalizeRuntimeRoot(segment)
}

function rootRule(rules: MetadataFieldsRules, root: string): MetadataFieldsRulesItem | undefined {
  return rules[root]
}

export function canonicalizeGraphTechnicalSegment(segment: string): string {
  return GRAPH_SEGMENTS_FROM_YAML[segment as keyof typeof GRAPH_SEGMENTS_FROM_YAML] ?? segment
}

function isCanonicalMetadataRoot(root: string): boolean {
  return root in MetadataFieldsRulesToYAML || root in MetadataTypeToYAML
}

function isMetadataTechnicalSegmentPosition(index: number, length: number): boolean {
  return index >= 2 && index < length - 1 && index % 2 === 0
}

function canonicalGraphSegment(segment: string, index: number, length: number): string | undefined {
  if (!isMetadataTechnicalSegmentPosition(index, length)) return undefined
  const canonical = canonicalizeGraphTechnicalSegment(segment)
  return canonical === segment ? undefined : canonical
}

function canonicalizePath(path: string, rootRules: MetadataFieldsRules): string {
  const parts = path.split(".")
  const root = normalizeRootSegment(parts[0] ?? "", rootRules)
  const result = [root]
  let currentRules: MetadataFieldsRules | undefined
  let pendingRules = childRules(rootRule(rootRules, root), root)

  for (const [offset, part] of parts.slice(1).entries()) {
    const partIndex = offset + 1
    const ruleKey = findRuleKeyByName(currentRules, part)

    if (ruleKey) {
      const rule = currentRules?.[ruleKey]
      result.push(ruleKey)
      currentRules = ruleKey === "StandardAttribute" ? childRules(rule, ruleKey) : undefined
      pendingRules = ruleKey === "StandardAttribute" ? undefined : childRules(rule, ruleKey)
      continue
    }

    result.push(canonicalGraphSegment(part, partIndex, parts.length) ?? part)
    currentRules = pendingRules
    pendingRules = undefined
  }

  return result.join(".")
}

function canonicalStandardAttributeName(name: string): string | undefined {
  return findRuleKeyByName(COMMON_STANDARD_ATTRIBUTE_RULES, name)
}

export type RuntimeChildKind = "Attribute" | "TabularSection"

export interface CanonicalizeRuntimeObjectPathOptions {
  defaultChildKind?: RuntimeChildKind
}

function canonicalRuntimeTail(
  ownerKind: string,
  tail: string[],
  options: CanonicalizeRuntimeObjectPathOptions = {},
): string[] {
  if (tail.length === 0) return tail

  const [head, ...rest] = tail
  const standardAttributeName = canonicalStandardAttributeName(head)
  if (standardAttributeName) return ["StandardAttribute", standardAttributeName, ...rest]
  if (head in GRAPH_SEGMENTS_TO_YAML) return tail

  const graphPath = canonicalizeMetadataGraphPath([ownerKind, "_", ...tail].join("."))
    .split(".")
    .slice(2)
  if (graphPath[0] !== head) return graphPath

  if (options.defaultChildKind) return [options.defaultChildKind, head, ...rest]

  return tail
}

export function canonicalizeMetadataGraphPath(path: string): string {
  if (isRuntimeRootSegment(path.split(".")[0] ?? "")) return canonicalizeRuntimeObjectPath(path)
  return canonicalizePath(path, MetadataFieldsRulesToYAML)
}

export function canonicalizeGraphChildIdSuffix(idSuffix: string): string {
  const parts = idSuffix.split(".")
  if (parts.length < 2) return idSuffix
  return [canonicalizeGraphTechnicalSegment(parts[0]!), ...parts.slice(1)].join(".")
}

export function canonicalizeGraphNodeId(path: string): string {
  const parts = canonicalizeMetadataGraphPath(path).split(".")
  const hasMetadataRoot = isCanonicalMetadataRoot(parts[0] ?? "")

  return parts
    .map((part, index) => {
      if (index === 0 || index === parts.length - 1) return part
      if (hasMetadataRoot && !isMetadataTechnicalSegmentPosition(index, parts.length)) return part
      return canonicalizeGraphTechnicalSegment(part)
    })
    .join(".")
}

export function canonicalizeRuntimeObjectPath(
  path: string,
  options: CanonicalizeRuntimeObjectPathOptions = {},
): string {
  const parts = path.split(".")
  const ownerKind = normalizeRootSegment(parts[0] ?? "", MetadataFieldsRulesToYAML)
  const ownerName = parts[1]
  if (!ownerName) return ownerKind

  return [ownerKind, ownerName, ...canonicalRuntimeTail(ownerKind, parts.slice(2), options)].join(".")
}

export function canonicalizeMetadataTypeGraphPath(path: string): string {
  const parts = path.split(".")
  const root = normalizeRootSegment(parts[0] ?? "", MetadataTypesRulesToYAML)
  return [root, ...parts.slice(1)].join(".")
}

export function canonicalizeMetadataValueGraphPath(path: string): string {
  const convertedPath = canonicalizePath(path, MetadataValuesRulesToYAML)
  if (convertedPath.startsWith("Enum."))
    return convertedPath
      .split(".")
      .filter((part) => part !== "EnumValue")
      .join(".")

  const parts = convertedPath.split(".")
  if (parts.length !== 3 || parts[2] === "EmptyRef") return convertedPath

  return [parts[0], parts[1], "PredefinedData", parts[2]].join(".")
}
