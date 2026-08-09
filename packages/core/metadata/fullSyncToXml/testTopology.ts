import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { projectXmlExportAssignment } from "../resourceTopology/core/xmlExportProjection"
import type { FullXmlSyncAssignment } from "./types"

export function fullXmlSyncTestTopologyFields(
  sourceProjectPath: string
): Pick<FullXmlSyncAssignment, "nodeId" | "potentialOutputs"> {
  const topology = compileRegisteredMetadataResourceTopology()
  const resource = classifyMetadataProjectPath(topology, sourceProjectPath)
  if (resource?.kind !== "content") throw new Error(`Не найден тестовый ресурс топологии: ${sourceProjectPath}`)
  const projected = projectXmlExportAssignment(topology, resource)
  return { nodeId: projected.nodeId, potentialOutputs: projected.potentialOutputs }
}

export function fullXmlSyncTestOutput(targetXmlPath: string) {
  return {
    nodeId: "test-assignment",
    potentialOutputs: [
      {
        declarationId: "test-document",
        targetXmlPath,
        role: "metadata" as const,
        required: true,
        prepareCapabilityId: "test",
      },
    ],
  }
}
