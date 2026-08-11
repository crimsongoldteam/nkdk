import { currentRuleRegistrySet, rootFromYAML } from "@nkdk/runtime/rule-kit"
import type {
  MetadataRootName,
  MetadataTargetConstraint,
} from "@nkdk/runtime/rule-kit"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { MetadataTargetOwnerDeclaration } from "@nkdk/runtime/rule-kit"
import type { OwnerFactRole } from "@nkdk/runtime/rule-kit"
import { registeredStandardMemberAliases } from "@nkdk/runtime/rule-kit"
import {
  getTypeRule,
  resolvePropertyItemRule,
} from "../ruleRuntime/property/typeRuleRegistry"
import {
  getConfigurationValidationProjectSpec,
  getValidationProjectSpecs,
  type ValidationProjectSpec,
} from "./projectSpecs"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import { compileMetadataResourceTopologyForRootRule } from "../resourceTopology/adapters/ruleTopology"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { currentValidationRegistrySet } from "./validationExecutionContext"

export interface ValidationRulesSnapshot {
  version: 1
  specs: ValidationRulesSpecSnapshot[]
  items: ValidationRulesItemSnapshot[]
}

export interface ValidationRulesItemSnapshot {
  topologyNodeId: string
  itemType: string
  metadataTargetOwner?: MetadataTargetOwnerDeclaration
  uniqueNameScopes: readonly ValidationRulesUniqueNameScopeSnapshot[]
  properties: readonly ValidationRulesPropertySnapshot[]
  standardMemberAliases: Readonly<Record<string, string>>
}

export interface ValidationRulesSpecSnapshot {
  dir: string
  kind: ValidationProjectSpec["kind"]
  itemType: string
  root?: MetadataRootName
  metadataTargetOwner?: MetadataTargetOwnerDeclaration
  nesting?: ValidationRulesNestingSnapshot
  uniqueNameScopes: readonly ValidationRulesUniqueNameScopeSnapshot[]
  properties: readonly ValidationRulesPropertySnapshot[]
  standardMemberAliases: Readonly<Record<string, string>>
}

export interface ValidationRulesNestingSnapshot {
  kind: "recursiveChildDir"
  childDir: string
}

export interface ValidationRulesUniqueNameScopeSnapshot {
  collections: readonly string[]
}

export interface ValidationRulesPropertySnapshot {
  modelKey: string
  yamlPath: readonly string[]
  type?: string
  metadataTarget?: MetadataTargetConstraint
  ownerFactRole?: OwnerFactRole
  nestedItemType?: string
  children?: readonly ValidationRulesPropertySnapshot[]
}

interface SnapshotSourceProperty {
  yaml?: string
  type: string
  metadataTarget?: MetadataTargetConstraint
  ownerFactRole?: OwnerFactRole
  yamlInline?: true
  itemRule?: ValidationProjectSpec["rule"]
}

export function createValidationRulesSnapshot(
  _context: ConfigurationContext,
  topology?: CompiledMetadataResourceTopology | readonly CompiledMetadataResourceTopology[],
  rules?: RuleRegistrySet,
): ValidationRulesSnapshot {
  const effectiveRules = rules ?? currentRuleRegistrySet<RuleRegistrySet>()
  if (effectiveRules === undefined) {
    throw new Error("Не задан execution context metadata rules")
  }
  const effectiveTopology = topology ?? validationRulesTopologies(effectiveRules)
  const topologies: readonly CompiledMetadataResourceTopology[] = isCompiledTopology(effectiveTopology)
    ? [effectiveTopology]
    : effectiveTopology
  const items = new Map<string, ValidationRulesItemSnapshot>()
  for (const current of topologies) {
    for (const assignment of current.assignments) {
      items.set(
        `${assignment.id}\u0000${assignment.itemRule.itemType}`,
        snapshotItem(assignment.id, assignment.itemRule, effectiveRules),
      )
    }
  }
  return {
    version: 1,
    specs: validationRulesSpecs(effectiveRules).map((spec) => snapshotSpec(spec, effectiveRules)),
    items: [...items.values()],
  }
}

function isCompiledTopology(
  value: CompiledMetadataResourceTopology | readonly CompiledMetadataResourceTopology[],
): value is CompiledMetadataResourceTopology {
  return !Array.isArray(value)
}

function validationRulesTopologies(
  rules: RuleRegistrySet,
): readonly CompiledMetadataResourceTopology[] {
  if (rules !== undefined) {
    return [...rules.components.values()].map(({ rootRule }) =>
      rules.resourceTopology.get(rootRule))
  }
  const specs = validationRulesSpecs()
  return (["configuration", "configurationExtension"] as const).map((kind) =>
    compileMetadataResourceTopologyForRootRule(getMetadataComponentDescriptor(kind).rootRule, specs)
  )
}

export function findValidationRulesSpec(
  snapshot: ValidationRulesSnapshot,
  dir: string
): ValidationRulesSpecSnapshot | undefined {
  return snapshot.specs.find((spec) => spec.dir === dir)
}

export function findValidationRulesItem(
  snapshot: ValidationRulesSnapshot,
  itemType: string,
  topologyNodeId?: string,
): ValidationRulesItemSnapshot | undefined {
  return topologyNodeId === undefined
    ? snapshot.items.find((item) => item.itemType === itemType)
    : snapshot.items.find((item) => item.topologyNodeId === topologyNodeId)
      ?? snapshot.items.find((item) => item.itemType === itemType)
}

function snapshotItem(
  topologyNodeId: string,
  rule: ValidationProjectSpec["rule"],
  rules?: RuleRegistrySet,
): ValidationRulesItemSnapshot {
  return {
    topologyNodeId,
    ...snapshotRule(rule, rules),
  }
}

function snapshotSpec(
  spec: ValidationProjectSpec,
  rules?: RuleRegistrySet,
): ValidationRulesSpecSnapshot {
  const rule = spec.rule

  return {
    dir: spec.dir,
    kind: spec.kind,
    ...snapshotRule(rule, rules),
    ...(rootFromYAML[spec.dir] === undefined ? {} : { root: rootFromYAML[spec.dir] }),
    ...(spec.nesting === undefined ? {} : { nesting: { kind: spec.nesting.kind, childDir: spec.nesting.childDir } }),
  }
}

function snapshotRule(
  rule: ValidationProjectSpec["rule"],
  rules?: RuleRegistrySet,
): Omit<ValidationRulesItemSnapshot, "topologyNodeId"> {
  return {
    itemType: rule.itemType,
    ...(rule.metadataTargetOwner === undefined ? {} : { metadataTargetOwner: rule.metadataTargetOwner }),
    uniqueNameScopes: (rule.uniqueNameScopes ?? []).map((scope) => ({ collections: [...scope.collections] })),
    properties: snapshotProperties(
      rule.properties,
      new Set([rule.itemType]),
      rules,
    ),
    standardMemberAliases: contextualStandardMemberAliases(),
  }
}

function contextualStandardMemberAliases(): Readonly<Record<string, string>> {
  const pairs = currentValidationRegistrySet<{
    dataPaths: { getStandardMemberNamePairs(): readonly { internal: string; yaml: string }[] }
  }>()?.dataPaths.getStandardMemberNamePairs()
  return pairs === undefined
    ? registeredStandardMemberAliases()
    : Object.fromEntries(pairs.map(({ yaml, internal }) => [yaml, internal]))
}

function snapshotProperties(
  properties: ValidationProjectSpec["rule"]["properties"],
  ancestorItemTypes: ReadonlySet<string>,
  rules?: RuleRegistrySet,
): ValidationRulesPropertySnapshot[] {
  return Object.entries(properties as Readonly<Record<string, SnapshotSourceProperty>>).flatMap(([modelKey, property]) => {
    if (property.yaml === undefined) return []
    return [
      {
        modelKey,
        yamlPath: [property.yaml],
        type: property.type,
        ...(property.metadataTarget === undefined ? {} : { metadataTarget: property.metadataTarget }),
        ...(property.ownerFactRole === undefined ? {} : { ownerFactRole: property.ownerFactRole }),
        ...childrenSnapshot(property, ancestorItemTypes, rules),
      },
    ]
  })
}

function childrenSnapshot(
  property: SnapshotSourceProperty,
  ancestorItemTypes: ReadonlySet<string>,
  rules?: RuleRegistrySet,
): {
  nestedItemType?: string
  children?: readonly ValidationRulesPropertySnapshot[]
} {
  const itemRule = nestedItemRule(property, rules)
  if (itemRule === undefined) return {}
  if (ancestorItemTypes.has(itemRule.itemType)) return { nestedItemType: itemRule.itemType }
  return {
    nestedItemType: itemRule.itemType,
    children: snapshotProperties(
      itemRule.properties,
      new Set([...ancestorItemTypes, itemRule.itemType]),
      rules,
    ),
  }
}

function nestedItemRule(
  property: SnapshotSourceProperty,
  rules?: RuleRegistrySet,
): ValidationProjectSpec["rule"] | undefined {
  const collectionRule = rules?.execution.resolvePropertyItemRule(property)
    ?? (rules === undefined ? resolvePropertyItemRule(property) : undefined)
  if (collectionRule !== undefined) return collectionRule
  const nested = rules === undefined
    ? getTypeRule(property.type, "nestedItemRule")
    : rules.execution.getTypeRule(property.type, "nestedItemRule")
  return nested !== undefined && "itemRule" in nested ? nested.itemRule : undefined
}

function validationRulesSpecs(
  rules?: RuleRegistrySet,
): ValidationProjectSpec[] {
  return rules === undefined
    ? [getConfigurationValidationProjectSpec(), ...getValidationProjectSpecs()].filter(
        (spec): spec is ValidationProjectSpec => spec !== undefined,
      )
    : [...rules.projectSpecs.values()]
      .sort((left, right) => left.dir.localeCompare(right.dir, "ru"))
}
