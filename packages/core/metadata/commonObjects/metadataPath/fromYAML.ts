import { parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import { isMetadataRootName, rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"

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
  return parseMetadataTargetStringFromYAML(context, name, metadataTargetForRule(rule, metadataFieldTargetFallback), owner)
}

export const importMetadataObjectStringFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string,
  owner?: MetadataTargetOwner
): string | undefined => {
  return parseMetadataTargetStringFromYAML(context, name, metadataTargetForRule(rule, metadataObjectTargetFallback), owner)
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

function parseMetadataTargetStringFromYAML(
  _context: ConfigurationContext,
  name: string,
  constraint: MetadataTargetConstraint,
  owner?: MetadataTargetOwner
): string | undefined {
  return parseMetadataTargetStringResultFromYAML({
    name,
    result: parseMetadataTargetFromYAML({ value: name, constraint, owner }),
  })
}

function parseMetadataTargetStringResultFromYAML(params: {
  name: string
  result: ReturnType<typeof parseMetadataTargetFromYAML>
}): string | undefined {
  if (params.result.ok) return params.result.canonical
  if (!isMetadataTargetLikeYAML(params.name)) return undefined

  throw new Error(params.result.message)
}

function isMetadataTargetLikeYAML(value: string): boolean {
  const root = value.split(".")[0]
  return rootFromYAML[root] !== undefined || isMetadataRootName(root)
}
