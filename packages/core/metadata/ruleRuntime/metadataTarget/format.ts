import { memberKindToYAML, objectPathKindToYAML, rootToYAML, standardAttributeToYAML } from "./roots"
import { parseMetadataTargetFromModel } from "./parse"
import type {
  MetadataMemberKind,
  MetadataMemberSegment,
  MetadataTargetConstraint,
  MetadataTargetOwner,
  ParsedMetadataTarget,
} from "./types"

export interface FormatMetadataTargetToYAMLInput {
  canonical: string
  constraint: MetadataTargetConstraint
  owner?: MetadataTargetOwner
}

const emptyRefYAML = "ПустаяСсылка"

export function formatMetadataTargetToYAML(input: FormatMetadataTargetToYAMLInput): string {
  const result = parseMetadataTargetFromModel(input)
  if (!result.ok) {
    throw new Error(result.message)
  }

  return formatParsedMetadataTargetToYAML(result.target, input.constraint, input.owner)
}

function formatParsedMetadataTargetToYAML(
  target: ParsedMetadataTarget,
  constraint: MetadataTargetConstraint,
  owner: MetadataTargetOwner | undefined
): string {
  switch (target.kind) {
    case "object":
      if (shouldUseShortObjectYAML(target, constraint)) return target.objectName
      return [
        rootToYAML[target.root],
        target.objectName,
        ...(target.segments ?? []).flatMap((segment) => [formatObjectSegmentKind(segment.kind), segment.objectName]),
      ].join(".")
    case "member":
      return formatMemberTargetToYAML(target, constraint, owner)
    case "value":
      return formatValueTargetToYAML(target)
  }
}

function shouldUseShortObjectYAML(target: ParsedMetadataTarget, constraint: MetadataTargetConstraint): boolean {
  if (target.kind !== "object") return false
  if (constraint.kind !== "object") return false
  if (constraint.allowedObjectPaths !== undefined) return false
  if (constraint.allowNested === true) return false
  if (constraint.nestedObjectRoots !== undefined) return false
  if ((constraint.filters?.length ?? 0) > 0) return false
  if (target.segments !== undefined && target.segments.length > 0) return false
  return constraint.roots?.length === 1 && constraint.roots[0] === target.root
}

function formatMemberTargetToYAML(
  target: Extract<ParsedMetadataTarget, { kind: "member" }>,
  constraint: MetadataTargetConstraint,
  owner: MetadataTargetOwner | undefined
): string {
  const full = [
    rootToYAML[target.root],
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [formatObjectSegmentKind(segment.kind), segment.objectName]),
    ...target.segments.flatMap((segment) => [memberKindToYAML[segment.kind], formatMemberSegmentName(segment)]),
  ].join(".")

  if (constraint.kind !== "member" || constraint.owner !== "this") return full
  if (!owner) throw new Error('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  if (target.root !== owner.root || target.objectName !== owner.objectName) {
    if (constraint.allowedMemberPaths?.some((allowedPath) => memberTargetMatchesAllowedPath(target, allowedPath))) {
      return full
    }
    throw new Error(
      `Цель "${target.root}.${target.objectName}" не принадлежит текущему объекту "${owner.root}.${owner.objectName}"`
    )
  }

  const memberKinds = constraint.memberKinds ?? allMemberKinds()
  const localSegments = target.segments.flatMap((segment) => [
    memberKindToYAML[segment.kind],
    formatMemberSegmentName(segment),
  ])
  if (target.segments.length === 1 && memberKinds.length === 1) return formatMemberSegmentName(target.segments[0])
  return localSegments.join(".")
}

function memberTargetMatchesAllowedPath(
  target: Extract<ParsedMetadataTarget, { kind: "member" }>,
  allowedPath: readonly [string, ...string[]]
): boolean {
  const targetPath = [
    target.root,
    ...(target.objectSegments ?? []).map((segment) => segment.kind),
    ...target.segments.map((segment) => segment.kind),
  ]

  return targetPath.length === allowedPath.length && targetPath.every((part, index) => part === allowedPath[index])
}

function formatMemberSegmentName(segment: MetadataMemberSegment): string {
  if (segment.kind !== "StandardAttribute") return segment.name
  return standardAttributeToYAML[segment.name] ?? segment.name
}

function formatObjectSegmentKind(kind: keyof typeof rootToYAML | keyof typeof objectPathKindToYAML): string {
  return objectPathKindToYAML[kind as keyof typeof objectPathKindToYAML] ?? rootToYAML[kind as keyof typeof rootToYAML]
}

function formatValueTargetToYAML(target: Extract<ParsedMetadataTarget, { kind: "value" }>): string {
  if (target.valueKind === "emptyRef") {
    return `${rootToYAML[target.root]}.${target.objectName}.${emptyRefYAML}`
  }

  return `${rootToYAML[target.root]}.${target.objectName}.${target.valueName}`
}

function allMemberKinds(): readonly MetadataMemberKind[] {
  return Object.keys(memberKindToYAML) as MetadataMemberKind[]
}
