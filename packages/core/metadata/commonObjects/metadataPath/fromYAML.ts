import { parseMetadataTargetFromYAML } from "../metadataTargets"
import { isMetadataRootName, rootFromYAML } from "../metadataTargets/roots"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "../metadataTargets/types"
import type { ConfigurationContext } from "../../context/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { ImportFromYAMLFunctionNew } from "../../orchestration/property/fn"
import type { PropertyRule } from "../../orchestration/property/types"
import { importDataPathStandardMembersFromYAML } from "./dataPathStandardMembers"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint
const metadataFieldTargetFallback = { kind: "member", owner: "explicit" } as const satisfies MetadataTargetConstraint
const metadataValueTargetFallback = {
  kind: "value",
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
  allowEmptyRef: true,
} as const satisfies MetadataTargetConstraint

export const importMetadataFieldStringFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string,
  owner?: MetadataTargetOwner
): string | undefined => {
  return parseMetadataTargetStringFromYAML(
    context,
    name,
    metadataTargetForRule(rule, metadataFieldTargetFallback),
    owner,
    isStrictObjectTargetRule(rule)
  )
}

export const importMetadataObjectStringFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string,
  owner?: MetadataTargetOwner
): string | undefined => {
  return parseMetadataTargetStringFromYAML(
    context,
    name,
    metadataTargetForRule(rule, metadataObjectTargetFallback),
    owner,
    isStrictObjectTargetRule(rule)
  )
}

export const importMetadataValueStringFromYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  const constraint = metadataTargetForRule(rule, metadataValueTargetFallback)
  const valueResult = parseMetadataTargetFromYAML({ value: name, constraint })
  if (valueResult.ok) return valueResult.canonical

  const objectResult =
    constraint.kind === "value"
      ? parseMetadataTargetFromYAML({
          value: name,
          constraint: metadataObjectTargetFallback,
        })
      : undefined
  if (objectResult?.ok) return objectResult.canonical

  return parseMetadataTargetStringResultFromYAML({
    name,
    result: valueResult,
  })
}

function metadataTargetForRule(
  rule: PropertyRule | undefined,
  fallback: MetadataTargetConstraint
): MetadataTargetConstraint {
  if (rule?.metadataTarget) return rule.metadataTarget
  if (rule?.type === "MetadataItemLink" || rule?.type === "MetadataItemLinks") return metadataObjectTargetFallback
  if (rule?.type === "MetadataField" || rule?.type === "MetadataFields") return metadataFieldTargetFallback

  return fallback
}

function isStrictObjectTargetRule(rule: PropertyRule | undefined): boolean {
  return rule?.metadataTarget?.kind === "object"
}

function parseMetadataTargetStringFromYAML(
  _context: ConfigurationContext,
  name: string,
  constraint: MetadataTargetConstraint,
  owner?: MetadataTargetOwner,
  strict = false
): string | undefined {
  return parseMetadataTargetStringResultFromYAML({
    name,
    result: parseMetadataTargetFromYAML({ value: name, constraint, owner }),
    strict,
  })
}

function parseMetadataTargetStringResultFromYAML(params: {
  name: string
  result: ReturnType<typeof parseMetadataTargetFromYAML>
  strict?: boolean
}): string | undefined {
  if (params.result.ok) return params.result.canonical
  if (params.strict === true) throw new Error(params.result.message)
  if (!isMetadataTargetLikeYAML(params.name)) return undefined

  throw new Error(params.result.message)
}

function isMetadataTargetLikeYAML(value: string): boolean {
  const root = value.split(".")[0]
  return rootFromYAML[root] !== undefined || isMetadataRootName(root)
}

const importDataPathFromYAML: ImportFromYAMLFunctionNew = ({ context, value }) => {
  return importDataPathStandardMembersFromYAML(context, value)
}

registerTypeRule("DataPath", "importFromYAML", importDataPathFromYAML)
