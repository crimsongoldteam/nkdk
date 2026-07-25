import { resolve } from "path"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/types"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import { discoverMetadataProjectResources } from "../resourceTopology/projectProjection"
import { expandMetadataPathPattern } from "../resourceTopology/patterns"
import { projectXmlExportAssignment } from "../resourceTopology/xmlExportProjection"
import type { FullXmlSyncAssignment, FullXmlSyncExternalFile, FullXmlSyncPlan } from "./types"

export interface BuildFullXmlSyncPlanOptions {
  readonly projectDir: string
  readonly topology?: CompiledMetadataResourceTopology
  readonly extraAssignments?: readonly FullXmlSyncAssignment[]
}

export async function buildFullXmlSyncPlan(options: BuildFullXmlSyncPlanOptions): Promise<FullXmlSyncPlan> {
  const topology = options.topology ?? compileRegisteredMetadataResourceTopology()
  const resources = await discoverMetadataProjectResources({
    topology,
    projectDir: options.projectDir,
  })
  const assignments = resources
    .filter((resource) => resource.kind === "content")
    .map((resource): FullXmlSyncAssignment => {
      const projected = projectXmlExportAssignment(topology, resource)
      const role =
        projected.assignmentRole === "fileItem" ? "form" : projected.assignmentRole
      return {
        id: resource.projectPath,
        sourceProjectPath: resource.projectPath,
        sourcePath: resolve(options.projectDir, ...resource.projectPath.split("/")),
        role,
        itemType: projected.itemType,
        itemName: projected.itemName,
        logicalAddress: projected.logicalAddress,
        ...(projected.owner === undefined ? {} : { owner: projected.owner }),
        nodeId: projected.nodeId,
        potentialOutputs: projected.potentialOutputs,
        outputs: projected.potentialOutputs
          .filter((output) => output.role === "metadata")
          .map((output) => ({
          routeKind: projected.assignmentRole === "fileItem" ? "fileItem" : "owner",
          targetXmlPath: output.targetXmlPath,
        })),
      }
    })
  const externalFiles = resources
    .filter((resource) => resource.kind === "externalFile" && resource.externalFile !== undefined)
    .filter((resource) => resource.externalFile!.direction !== "xmlToProject")
    .map((resource): FullXmlSyncExternalFile => ({
      assignmentId: resource.assignment?.id,
      sourceProjectPath: resource.projectPath,
      sourcePath: resolve(options.projectDir, ...resource.projectPath.split("/")),
      targetXmlPath: expandMetadataPathPattern(resource.externalFile!.xmlPattern, resource.values),
      transferCapabilityId: resource.externalFile!.transferCapabilityId,
    }))

  const plan = {
    assignments: [...assignments, ...(options.extraAssignments ?? [])].sort(compareBySourceProjectPath),
    externalFiles: externalFiles.sort(compareBySourceProjectPath),
  }
  assertUniqueXmlTargets(plan)
  return plan
}

function assertUniqueXmlTargets(plan: FullXmlSyncPlan): void {
  const seen = new Map<string, string>()
  for (const [owner, target] of [
    ...plan.assignments.flatMap((assignment) =>
      (assignment.potentialOutputs ?? assignment.outputs).map(
        (output) => [assignment.sourceProjectPath, output.targetXmlPath] as const
      )
    ),
    ...plan.externalFiles.map((file) => [file.sourceProjectPath, file.targetXmlPath] as const),
  ]) {
    const previous = seen.get(target)
    if (previous !== undefined) throw new Error(`Повторный XML-путь ${target}: ${previous} и ${owner}`)
    seen.set(target, owner)
  }
}

function compareBySourceProjectPath(
  left: { sourceProjectPath: string },
  right: { sourceProjectPath: string }
): number {
  return Buffer.compare(Buffer.from(left.sourceProjectPath), Buffer.from(right.sourceProjectPath))
}
