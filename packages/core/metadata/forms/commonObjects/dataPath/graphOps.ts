import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import type { GraphOps } from "~/metadata/orchestration/property/fn"
import {
  canonicalizeRuntimeObjectPath,
  type RuntimeChildKind,
} from "~/metadata/commonObjects/metadataPath/graphPath"

export const DATA_PATH_EDGE_KIND = "DATA_PATH"

export type DataPathMode = "global" | "formLocal"

export interface BuildDataPathGraphOpsParams {
  sourcePath: string
  propertyName: string
  edgeYaml: string
  formNodeId?: string
  fallbackChildKind?: RuntimeChildKind
}

function edgeProps(params: {
  propertyName: string
  sourcePath: string
  pathMode: DataPathMode
}) {
  return {
    property: params.propertyName,
    sourcePath: params.sourcePath,
    pathMode: params.pathMode,
  }
}

export function buildDataPathGraphOps(
  params: BuildDataPathGraphOpsParams,
): GraphOps | undefined {
  const { sourcePath, propertyName, edgeYaml, formNodeId, fallbackChildKind } = params
  if (!sourcePath) return undefined

  const globalPath = fallbackChildKind
    ? canonicalizeRuntimeObjectPath(sourcePath, { defaultChildKind: fallbackChildKind })
    : sourcePath
  const globalRef = extractReferenceFromPath(globalPath)
  if (globalRef) {
    return {
      references: [
        {
          ...globalRef,
          edgeProps: edgeProps({ propertyName, sourcePath, pathMode: "global" }),
        },
      ],
      edgeKind: DATA_PATH_EDGE_KIND,
      edgeYaml,
    }
  }

  if (!formNodeId) return undefined

  return {
    formLocalReferences: [
      {
        formLocalPath: sourcePath,
        formNodeId,
        fallbackChildKind,
        edgeProps: edgeProps({ propertyName, sourcePath, pathMode: "formLocal" }),
        dependsOnEdgeKind: "DATA_PATH_DEPENDS_ON",
      },
    ],
    edgeKind: DATA_PATH_EDGE_KIND,
    edgeYaml,
  }
}
