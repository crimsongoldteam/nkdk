import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type {
  MetadataRootName,
  MetadataTargetConstraint,
} from "../commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "../context/types"
import type { MetadataTargetOwnerDeclaration } from "../orchestration/property/types"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
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
  children?: readonly ValidationRulesPropertySnapshot[]
}

interface SnapshotSourceProperty {
  yaml?: string | false
  type?: string
  metadataTarget?: MetadataTargetConstraint
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
    properties: snapshotProperties(rule.properties),
  }
}

function snapshotProperties(properties: ValidationProjectSpec["rule"]["properties"]): ValidationRulesPropertySnapshot[] {
  return Object.entries(properties as Readonly<Record<string, SnapshotSourceProperty>>).flatMap(([modelKey, property]) => {
    if (property.yaml === false || property.yaml === undefined) return []

    return [
      {
        modelKey,
        yamlPath: [property.yaml],
        ...(property.type === undefined ? {} : { type: property.type }),
        ...(property.metadataTarget === undefined ? {} : { metadataTarget: property.metadataTarget }),
        ...childrenSnapshot(property),
      },
    ]
  })
}

function childrenSnapshot(property: SnapshotSourceProperty): { children?: readonly ValidationRulesPropertySnapshot[] } {
  const itemRule = nestedItemRule(property)
  return itemRule === undefined ? {} : { children: snapshotProperties(itemRule.properties) }
}

function nestedItemRule(property: SnapshotSourceProperty): ValidationProjectSpec["rule"] | undefined {
  if (property.type !== undefined) {
    const collectionItemRule = getTypeRule(property.type, "collectionItemRule")
    if (collectionItemRule?.itemRule) return collectionItemRule.itemRule
  }

  if ("itemRule" in property && property.itemRule !== undefined) {
    return property.itemRule as ValidationProjectSpec["rule"]
  }

  return undefined
}
