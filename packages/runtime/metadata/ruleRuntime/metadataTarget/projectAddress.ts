import { formatMetadataTargetToYAML } from "./format"
import { parseMetadataTargetFromModel } from "./parse"
import type { MetadataTargetConstraint } from "./types"

const exactProjectObjectPaths = [
  ["ExternalDataSource", "Table"],
  ["ExternalDataSource", "Cube"],
  ["ExternalDataSource", "Cube", "DimensionTable"],
  ["ExternalDataSource", "Function"],
  ["CalculationRegister", "Recalculation"],
] as const

const exactProjectMemberPaths = [
  ["ExternalDataSource", "Table", "Field"],
  ["ExternalDataSource", "Table", "Command"],
  ["ExternalDataSource", "Cube", "DimensionTable", "Field"],
  ["ExternalDataSource", "Cube", "Dimension"],
  ["ExternalDataSource", "Cube", "Resource"],
  ["ExternalDataSource", "Cube", "Command"],
] as const

const projectAddressConstraints: readonly MetadataTargetConstraint[] = [
  {
    kind: "member",
    owner: "explicit",
    allowedMemberPaths: exactProjectMemberPaths,
  },
  {
    kind: "object",
    allowedObjectPaths: exactProjectObjectPaths,
  },
  { kind: "object", allowNested: true },
  { kind: "member", owner: "explicit", allowOwner: true },
  { kind: "value", allowEmptyRef: true },
]

export function formatCanonicalMetadataTargetToYAML(canonical: string): string | undefined {
  for (const constraint of projectAddressConstraints) {
    if (!parseMetadataTargetFromModel({ canonical, constraint }).ok) continue
    return formatMetadataTargetToYAML({ canonical, constraint })
  }
  return undefined
}
