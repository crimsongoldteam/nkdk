import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { ConfigurationContext } from "../context/types"
import { createFormDataPathIndexFromYAML } from "../validation/dataPath/formYamlIndex"
import { collectFormDataPathOccurrencesFromYAML } from "../validation/dataPath/formYamlTraversal"
import { createOwnerMetadataCache, type OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import { resolveDataPath, type ResolvedDataPathTarget } from "../validation/dataPath/resolver"
import { createProjectYamlCache } from "../validation/projectYamlCache"
import type { OperationSnapshotItem } from "./projectSnapshot"

export interface DataPathReferenceInput {
  item: OperationSnapshotItem
  filePath: string
  yamlPath: readonly (string | number)[]
  value: string
  target: ResolvedDataPathTarget
  segmentIndex: number
  setValue(nextValue: string): void
}

export function rewriteDataPathSegments(
  value: string,
  resolvedSegments: readonly string[],
  segmentIndex: number,
  nextName: string
): string {
  const sourceSegments = value.split(".")
  return sourceSegments
    .map((segment, index) => {
      if (index !== segmentIndex) return segment
      const resolvedSegment = resolvedSegments[index] ?? ""
      const suffix = segment.slice(resolvedSegment.length)
      return `${nextName}${suffix}`
    })
    .join(".")
}

export function createOperationDataPathOwnerCache(params: {
  projectDir: string
  context: ConfigurationContext
}): OwnerMetadataCache {
  return createOwnerMetadataCache({
    projectDir: params.projectDir,
    yamlCache: createProjectYamlCache(),
    context: params.context,
  })
}

export function collectFormDataPathReferencesForItem(params: {
  item: OperationSnapshotItem
  ownerCache: OwnerMetadataCache
  targetPrefix: string
}): DataPathReferenceInput[] {
  if (params.item.kind !== "form") return []

  const index = createFormDataPathIndexFromYAML(params.item.yaml)

  const references: DataPathReferenceInput[] = []
  for (const occurrence of collectFormDataPathOccurrencesFromYAML({
    yaml: params.item.yaml,
    rule: params.item.rule,
  })) {
    const result = resolveDataPath({
      filePath: params.item.filePath,
      parsed: params.item.parsed,
      yamlPath: occurrence.yamlPath,
      value: occurrence.value,
      index,
      ownerCache: params.ownerCache,
      ...(occurrence.tableContext !== undefined ? { tableContext: occurrence.tableContext } : {}),
    })

    if (result.status === "error" || result.target === undefined) continue

    const match = dataPathTargetMatchesCanonicalPrefix(result.target, params.targetPrefix)
    if (match === undefined) continue

    references.push({
      item: params.item,
      filePath: params.item.filePath,
      yamlPath: occurrence.yamlPath,
      value: occurrence.value,
      target: result.target,
      segmentIndex: match.segmentIndex,
      setValue: occurrence.setValue,
    })
  }

  return references
}

export function dataPathTargetMatchesCanonicalPrefix(
  target: ResolvedDataPathTarget,
  canonicalPrefix: string
): { segmentIndex: number } | undefined {
  if (target.source.kind !== "objectField") return undefined
  const ownerRoot = rootFromYAML[target.source.owner.kind] ?? target.source.owner.kind
  const ownerName = target.source.owner.name
  if (ownerName === undefined) return undefined

  const canonical = `${ownerRoot}.${ownerName}.Attribute.${target.source.name}`
  if (canonical === canonicalPrefix || canonical.startsWith(`${canonicalPrefix}.`)) {
    return { segmentIndex: target.segments.length - 1 }
  }
  return undefined
}
