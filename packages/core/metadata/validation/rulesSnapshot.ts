import { rootFromYAML } from "../ruleRuntime/metadataTarget/roots"
import type {
  MetadataRootName,
  MetadataTargetConstraint,
} from "../ruleRuntime/metadataTarget/types"
import type { ConfigurationContext } from "../context/types"
import type { MetadataTargetOwnerDeclaration } from "../ruleRuntime/property/types"
import type { OwnerFactRole } from "../ruleRuntime/property/types"
import { registeredStandardMemberAliases } from "../ruleRuntime/metadataTarget/standardMemberAliases"
import {
  getTypeRule,
  registerTypeRule,
  resolvePropertyItemRule,
} from "../ruleRuntime/property/typeRuleRegistry"
import { collectOwnerFactFromYAML } from "./dataPath/ownerFacts"
import {
  configurationValidationProjectSpec,
  validationProjectSpecs,
  type ValidationProjectSpec,
} from "./projectSpecs"

export interface ValidationRulesSnapshot {
  version: 1
  specs: ValidationRulesSpecSnapshot[]
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

export function createValidationRulesSnapshot(_context: ConfigurationContext): ValidationRulesSnapshot {
  return {
    version: 1,
    specs: [configurationValidationProjectSpec, ...validationProjectSpecs].map(snapshotSpec),
  }
}

export function findValidationRulesSpec(
  snapshot: ValidationRulesSnapshot,
  dir: string
): ValidationRulesSpecSnapshot | undefined {
  return snapshot.specs.find((spec) => spec.dir === dir)
}

function snapshotSpec(spec: ValidationProjectSpec): ValidationRulesSpecSnapshot {
  const rule = spec.rule

  return {
    dir: spec.dir,
    kind: spec.kind,
    itemType: rule.itemType,
    ...(rootFromYAML[spec.dir] === undefined ? {} : { root: rootFromYAML[spec.dir] }),
    ...(rule.metadataTargetOwner === undefined ? {} : { metadataTargetOwner: rule.metadataTargetOwner }),
    ...(spec.nesting === undefined ? {} : { nesting: { kind: spec.nesting.kind, childDir: spec.nesting.childDir } }),
    uniqueNameScopes: (rule.uniqueNameScopes ?? []).map((scope) => ({ collections: [...scope.collections] })),
    properties: snapshotProperties(rule.properties, new Set([rule.itemType])),
    standardMemberAliases: registeredStandardMemberAliases(),
  }
}

function snapshotProperties(
  properties: ValidationProjectSpec["rule"]["properties"],
  ancestorItemTypes: ReadonlySet<string>
): ValidationRulesPropertySnapshot[] {
  return Object.entries(properties as Readonly<Record<string, SnapshotSourceProperty>>).flatMap(([modelKey, property]) => {
    if (property.yaml === undefined) return []
    if (property.ownerFactRole !== undefined) {
      registerTypeRule(property.type as never, "collectLocalFactsFromYAML", collectOwnerFactFromYAML)
    }

    return [
      {
        modelKey,
        yamlPath: [property.yaml],
        type: property.type,
        ...(property.metadataTarget === undefined ? {} : { metadataTarget: property.metadataTarget }),
        ...(property.ownerFactRole === undefined ? {} : { ownerFactRole: property.ownerFactRole }),
        ...childrenSnapshot(property, ancestorItemTypes),
      },
    ]
  })
}

function childrenSnapshot(property: SnapshotSourceProperty, ancestorItemTypes: ReadonlySet<string>): {
  nestedItemType?: string
  children?: readonly ValidationRulesPropertySnapshot[]
} {
  const itemRule = nestedItemRule(property)
  if (itemRule === undefined) return {}
  if (ancestorItemTypes.has(itemRule.itemType)) return { nestedItemType: itemRule.itemType }
  return {
    nestedItemType: itemRule.itemType,
    children: snapshotProperties(itemRule.properties, new Set([...ancestorItemTypes, itemRule.itemType])),
  }
}

function nestedItemRule(property: SnapshotSourceProperty): ValidationProjectSpec["rule"] | undefined {
  const collectionRule = resolvePropertyItemRule(property)
  if (collectionRule !== undefined) return collectionRule
  const nested = getTypeRule(property.type, "nestedItemRule")
  return nested !== undefined && "itemRule" in nested ? nested.itemRule : undefined
}
