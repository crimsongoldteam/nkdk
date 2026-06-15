import { fieldKindToYAML, memberKindToYAML, rootToYAML, standardAttributeToYAML } from "./roots"
import { parseMetadataTargetFromModel } from "./parse"
import type {
  MetadataFieldSegment,
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
      return [
        rootToYAML[target.root],
        target.objectName,
        ...(target.segments ?? []).flatMap((segment) => [rootToYAML[segment.root], segment.objectName]),
      ].join(".")
    case "field":
      return [
        rootToYAML[target.root],
        target.objectName,
        ...target.segments.flatMap((segment) => [fieldKindToYAML[segment.kind], formatFieldSegmentName(segment)]),
      ].join(".")
    case "member":
      return formatMemberTargetToYAML(target, constraint, owner)
    case "value":
      return formatValueTargetToYAML(target)
    case "styleItem":
      return `${rootToYAML.StyleItem}.${target.name}`
    case "commonPicture":
      return `${rootToYAML.CommonPicture}.${target.name}`
  }
}

function formatFieldSegmentName(segment: MetadataFieldSegment): string {
  if (segment.kind !== "StandardAttribute") return segment.name
  return standardAttributeToYAML[segment.name] ?? segment.name
}

function formatMemberTargetToYAML(
  target: Extract<ParsedMetadataTarget, { kind: "member" }>,
  constraint: MetadataTargetConstraint,
  owner: MetadataTargetOwner | undefined
): string {
  const full = [
    rootToYAML[target.root],
    target.objectName,
    ...target.segments.flatMap((segment) => [memberKindToYAML[segment.kind], formatMemberSegmentName(segment)]),
  ].join(".")

  if (constraint.kind !== "member" || constraint.owner !== "this") return full
  if (!owner) throw new Error('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  if (target.root !== owner.root || target.objectName !== owner.objectName) {
    throw new Error(
      `Цель "${target.root}.${target.objectName}" не принадлежит текущему объекту "${owner.root}.${owner.objectName}"`
    )
  }

  const memberKinds = constraint.memberKinds ?? allMemberKinds()
  const localSegments = target.segments.flatMap((segment) => [memberKindToYAML[segment.kind], formatMemberSegmentName(segment)])
  if (target.segments.length === 1 && memberKinds.length === 1) return formatMemberSegmentName(target.segments[0])
  return localSegments.join(".")
}

function formatMemberSegmentName(segment: MetadataMemberSegment): string {
  if (segment.kind !== "StandardAttribute") return segment.name
  return standardAttributeToYAML[segment.name] ?? segment.name
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
