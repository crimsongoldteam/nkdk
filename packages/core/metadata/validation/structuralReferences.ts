import type {
  MetadataTargetConstraint,
  MetadataTargetOwner,
  ParsedMetadataTarget,
} from "../orchestration/metadataTarget"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"

export interface StructuralReferencePropertyRule {
  readonly type: string
  readonly yaml?: string
  readonly metadataTarget?: {
    readonly kind: string
    readonly owner?: string
  }
}

export interface StructuralReferenceItemRule {
  readonly properties: Readonly<Record<string, StructuralReferencePropertyRule>>
}

export interface StructuralReferenceCandidate {
  readonly yamlPath: readonly (string | number)[]
  readonly canonical: string
  readonly setCanonical: (nextCanonical: string) => void
}

export interface IndexedStructuralReferenceCandidate {
  readonly yamlPath: readonly (string | number)[]
  readonly canonical: string
  readonly target: ParsedMetadataTarget
  readonly constraint: MetadataTargetConstraint
}

export type StructuralReferenceNestedRule =
  | { readonly kind: "externalFile" }
  | { readonly kind: "item"; readonly itemRule: StructuralReferenceItemRule }
  | {
      readonly kind: "polymorphicRecord"
      readonly resolveItemRule: (params: { yaml: Record<string, unknown>; name: string }) => StructuralReferenceItemRule
    }
  | {
      readonly kind: "collection"
      readonly itemRule: StructuralReferenceItemRule
      readonly resolveItemRule?: (params: {
        yaml: unknown
        name: string | undefined
        index: number
        propertyRule: StructuralReferencePropertyRule
      }) => StructuralReferenceItemRule
    }

export interface StructuralReferenceRuntime {
  readonly valueFromYAML: (params: {
    context: unknown
    rule: StructuralReferencePropertyRule
    value: unknown
    owner?: MetadataTargetOwner
  }) => unknown
  readonly valueToYAML: (params: {
    context: unknown
    rule: StructuralReferencePropertyRule
    value: unknown
    owner?: MetadataTargetOwner
  }) => unknown
  readonly collectStructuralReferences: (params: {
    filePath: string
    parsed: ParsedYaml
    yamlPath: readonly (string | number)[]
    propRule: StructuralReferencePropertyRule
    propertyName: string
    value: unknown
    setValue: (nextValue: unknown) => void
    owner?: MetadataTargetOwner
  }) => StructuralReferenceCandidate[] | undefined
  readonly collectIndexedReferences: (params: {
    filePath: string
    parsed: ParsedYaml
    yamlPath: readonly (string | number)[]
    propRule: StructuralReferencePropertyRule
    propertyName: string
    value: unknown
    owner?: MetadataTargetOwner
  }) => IndexedStructuralReferenceCandidate[]
  readonly nestedRule: (rule: StructuralReferencePropertyRule) => StructuralReferenceNestedRule | undefined
}

export interface StructuralYamlReference extends StructuralReferenceCandidate {
  readonly filePath: string
  readonly target: IndexedStructuralReferenceCandidate["target"]
  readonly constraint: IndexedStructuralReferenceCandidate["constraint"]
  readonly stageCanonical: (nextCanonical: string) => void
  readonly commitStaged: () => void
}

export type StructuralYamlReferenceCollectionResult =
  | { ok: true; references: StructuralYamlReference[] }
  | { ok: false; message: string }

export function collectStructuralYamlReferences(params: {
  filePath: string
  parsed: ParsedYaml
  rule: StructuralReferenceItemRule
  yaml: unknown
  owner?: MetadataTargetOwner
  context: unknown
  runtime: StructuralReferenceRuntime
}): StructuralYamlReferenceCollectionResult {
  return collectObjectReferences({
    ...params,
    value: params.yaml,
    yamlPath: [],
  })
}

function collectObjectReferences(params: {
  filePath: string
  parsed: ParsedYaml
  rule: StructuralReferenceItemRule
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
  context: unknown
  runtime: StructuralReferenceRuntime
}): StructuralYamlReferenceCollectionResult {
  const record = asRecord(params.value)
  if (record === undefined) return { ok: true, references: [] }

  const references: StructuralYamlReference[] = []
  for (const [propertyName, propertyRule] of Object.entries(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    const yamlValue = record[propertyRule.yaml]
    if (yamlValue === undefined) continue

    const handlerParams = {
      filePath: params.filePath,
      parsed: params.parsed,
      yamlPath: [...params.yamlPath, propertyRule.yaml],
      propRule: propertyRule,
      propertyName,
      owner: params.owner,
    }
    let typedValue = params.runtime.valueFromYAML({
      context: params.context,
      rule: propertyRule,
      value: yamlValue,
      owner: params.owner,
    })
    const candidates = params.runtime.collectStructuralReferences({
      ...handlerParams,
      value: typedValue,
      setValue: (nextValue) => {
        typedValue = nextValue
        record[propertyRule.yaml as string] = params.runtime.valueToYAML({
          context: params.context,
          rule: propertyRule,
          value: nextValue,
          owner: params.owner,
        })
      },
    })
    if (candidates !== undefined) {
      const indexedCandidates = params.runtime.collectIndexedReferences({
        ...handlerParams,
        value: typedValue,
      })
      let stagedCanonical: string | undefined
      const commitStaged = (): void => {
        if (stagedCanonical === undefined) return
        record[propertyRule.yaml as string] = params.runtime.valueToYAML({
          context: params.context,
          rule: propertyRule,
          value: typedValue,
          owner: ownerForRewrittenCanonical(propertyRule, params.owner, stagedCanonical),
        })
        stagedCanonical = undefined
      }
      for (const candidate of candidates) {
        if (typeof candidate.setCanonical !== "function") {
          throw new Error(`Правило ${propertyRule.type} распознало ссылку без setter в ${params.filePath}`)
        }
        const indexed = indexedCandidates.find((reference) =>
          reference.canonical === candidate.canonical && sameYamlPath(reference.yamlPath, candidate.yamlPath))
        if (indexed === undefined) {
          throw new Error(`Правило ${propertyRule.type} не материализовало индекс ссылки в ${params.filePath}`)
        }
        references.push({
          ...candidate,
          filePath: params.filePath,
          target: indexed.target,
          constraint: indexed.constraint,
          stageCanonical: (nextCanonical) => {
            candidate.setCanonical(nextCanonical)
            stagedCanonical = nextCanonical
          },
          commitStaged,
          setCanonical: (nextCanonical) => {
            candidate.setCanonical(nextCanonical)
            record[propertyRule.yaml as string] = params.runtime.valueToYAML({
              context: params.context,
              rule: propertyRule,
              value: typedValue,
              owner: ownerForRewrittenCanonical(propertyRule, params.owner, nextCanonical),
            })
          },
        })
      }
    }

    const nested = collectNestedReferences({
      ...params,
      value: yamlValue,
      propertyRule,
      yamlPath: [...params.yamlPath, propertyRule.yaml],
    })
    if (nested === undefined) continue
    if (!nested.ok) return nested
    references.push(...nested.references)
  }
  return { ok: true, references }
}

function collectNestedReferences(params: {
  filePath: string
  parsed: ParsedYaml
  propertyRule: StructuralReferencePropertyRule
  value: unknown
  yamlPath: Array<string | number>
  owner?: MetadataTargetOwner
  context: unknown
  runtime: StructuralReferenceRuntime
}): StructuralYamlReferenceCollectionResult | undefined {
  const descriptor = params.runtime.nestedRule(params.propertyRule)
  if (descriptor === undefined || descriptor.kind === "externalFile") return undefined
  if (descriptor.kind === "item") {
    return collectObjectReferences({ ...params, rule: descriptor.itemRule })
  }
  if (descriptor.kind === "polymorphicRecord") {
    const record = asRecord(params.value)
    return record === undefined
      ? { ok: true, references: [] }
      : collectObjectReferences({
          ...params,
          rule: descriptor.resolveItemRule({ yaml: record, name: "" }),
        })
  }
  if (Array.isArray(params.value)) {
    const references: StructuralYamlReference[] = []
    for (let index = 0; index < params.value.length; index += 1) {
      const result = collectObjectReferences({
        ...params,
        value: params.value[index],
        rule: descriptor.resolveItemRule?.({
          yaml: params.value[index],
          name: undefined,
          index,
          propertyRule: params.propertyRule,
        }) ?? descriptor.itemRule,
        yamlPath: [...params.yamlPath, index],
      })
      if (!result.ok) return result
      references.push(...result.references)
    }
    return { ok: true, references }
  }

  const record = asRecord(params.value)
  if (record === undefined) return { ok: true, references: [] }
  const references: StructuralYamlReference[] = []
  for (const [key, item] of Object.entries(record)) {
    const result = collectObjectReferences({
      ...params,
      value: item,
      rule: descriptor.resolveItemRule?.({
        yaml: item,
        name: key,
        index: references.length,
        propertyRule: params.propertyRule,
      }) ?? descriptor.itemRule,
      yamlPath: [...params.yamlPath, key],
    })
    if (!result.ok) return result
    references.push(...result.references)
  }
  return { ok: true, references }
}

function ownerForRewrittenCanonical(
  rule: StructuralReferencePropertyRule,
  owner: MetadataTargetOwner | undefined,
  canonical: string,
): MetadataTargetOwner | undefined {
  if (owner === undefined || rule.metadataTarget?.kind !== "member" || rule.metadataTarget.owner !== "this") return owner
  const [root, objectName] = canonical.split(".")
  return root === owner.root && objectName ? { root: owner.root, objectName } : owner
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined
}

function sameYamlPath(left: readonly (string | number)[], right: readonly (string | number)[]): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}
