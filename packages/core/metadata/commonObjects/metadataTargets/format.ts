import { fieldKindToYAML, rootToYAML } from "./roots"
import { parseMetadataTargetFromModel } from "./parse"
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "./types"

export interface FormatMetadataTargetToYAMLInput {
  canonical: string
  constraint: MetadataTargetConstraint
}

const emptyRefYAML = "ПустаяСсылка"

export function formatMetadataTargetToYAML(input: FormatMetadataTargetToYAMLInput): string {
  const result = parseMetadataTargetFromModel(input)
  if (!result.ok) {
    throw new Error(result.message)
  }

  return formatParsedMetadataTargetToYAML(result.target)
}

function formatParsedMetadataTargetToYAML(target: ParsedMetadataTarget): string {
  switch (target.kind) {
    case "object":
      return `${rootToYAML[target.root]}.${target.objectName}`
    case "field":
      return [
        rootToYAML[target.root],
        target.objectName,
        ...target.segments.flatMap((segment) => [fieldKindToYAML[segment.kind], segment.name]),
      ].join(".")
    case "value":
      return formatValueTargetToYAML(target)
    case "styleItem":
      return `${rootToYAML.StyleItem}.${target.name}`
    case "commonPicture":
      return `${rootToYAML.CommonPicture}.${target.name}`
  }
}

function formatValueTargetToYAML(target: Extract<ParsedMetadataTarget, { kind: "value" }>): string {
  if (target.valueKind === "emptyRef") {
    return `${rootToYAML[target.root]}.${target.objectName}.${emptyRefYAML}`
  }

  return `${rootToYAML[target.root]}.${target.objectName}.${target.valueName ?? ""}`
}
