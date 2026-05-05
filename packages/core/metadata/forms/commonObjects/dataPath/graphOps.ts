import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import type { GraphOps } from "~/metadata/orchestration/property/fn"

export const DATA_PATH_EDGE_KIND = "DATA_PATH"

export type DataPathMode = "global" | "formLocal"

export interface BuildDataPathGraphOpsParams {
  sourcePath: string
  propertyName: string
  edgeYaml: string
  formNodeId?: string
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
  const { sourcePath, propertyName, edgeYaml, formNodeId } = params
  if (!sourcePath) return undefined

  const globalRef = extractReferenceFromPath(sourcePath)
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
        edgeProps: edgeProps({ propertyName, sourcePath, pathMode: "formLocal" }),
        dependsOnEdgeKind: "DATA_PATH_DEPENDS_ON",
      },
    ],
    edgeKind: DATA_PATH_EDGE_KIND,
    edgeYaml,
  }
}
