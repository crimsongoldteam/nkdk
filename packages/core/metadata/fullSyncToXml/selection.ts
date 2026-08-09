import { resolve } from "path"
import { expandMetadataPathPattern } from "../resourceTopology/core/patterns"
import { projectXmlExportAssignment } from "../resourceTopology/core/xmlExportProjection"
import type {
  ComponentHashState,
  ComponentProjectStructure,
} from "../project/componentState/types"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncExternalFile,
  FullXmlSyncPlan,
} from "./types"

export type XmlSyncSelection =
  | { readonly kind: "all" }
  | {
      readonly kind: "selected"
      readonly projectPaths: readonly string[]
    }

export function buildXmlSyncPlan(params: {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly selection: XmlSyncSelection
}): FullXmlSyncPlan {
  assertMatchingComponent(params.structure, params.hashes)
  const selectedPaths =
    params.selection.kind === "all"
      ? new Set(params.structure.projectPaths)
      : new Set(assertUniqueKnownPaths(params.selection.projectPaths, params.structure))
  const hashesByPath = new Map(
    params.hashes.projectFiles.map(({ projectPath, contentHash }) => [projectPath, contentHash])
  )
  const resources = params.structure.resources.filter(({ projectPath }) =>
    selectedPaths.has(projectPath)
  )
  const assignments = resources
    .filter((resource) => resource.kind === "content")
    .map((resource): FullXmlSyncAssignment => {
      const projected = projectXmlExportAssignment(params.structure.topology, resource)
      return {
        id: resource.projectPath,
        sourceProjectPath: resource.projectPath,
        sourcePath: resolve(params.structure.componentDir, ...resource.projectPath.split("/")),
        expectedContentHash: requiredHash(hashesByPath, resource.projectPath),
        role: projected.assignmentRole === "fileItem" ? "form" : projected.assignmentRole,
        itemType: projected.itemType,
        itemName: projected.itemName,
        logicalAddress: projected.logicalAddress,
        ...(projected.owner === undefined ? {} : { owner: projected.owner }),
        nodeId: projected.nodeId,
        potentialOutputs: projected.potentialOutputs,
      }
    })
  const externalFiles = resources
    .filter((resource) => resource.kind === "externalFile" && resource.externalFile !== undefined)
    .filter((resource) => resource.externalFile!.direction !== "xmlToProject")
    .map((resource): FullXmlSyncExternalFile => ({
      assignmentId:
        resource.assignment === undefined
          ? resource.projectPath
          : expandMetadataPathPattern(resource.assignment.projectPattern, resource.values),
      sourceProjectPath: resource.projectPath,
      sourcePath: resolve(params.structure.componentDir, ...resource.projectPath.split("/")),
      expectedContentHash: requiredHash(hashesByPath, resource.projectPath),
      targetXmlPath: expandMetadataPathPattern(resource.externalFile!.xmlPattern, resource.values),
      transferCapabilityId: resource.externalFile!.transferCapabilityId,
    }))
  const plan = {
    assignments: assignments.sort(compareBySourceProjectPath),
    externalFiles: externalFiles.sort(compareBySourceProjectPath),
  }
  assertUniqueXmlTargets(plan)
  return plan
}

function assertMatchingComponent(
  structure: ComponentProjectStructure,
  hashes: ComponentHashState
): void {
  if (structure.componentPath !== hashes.componentPath) {
    throw new Error(
      `Структура и хэши относятся к разным компонентам: ${structure.componentPath} и ${hashes.componentPath}`
    )
  }
}

function assertUniqueKnownPaths(
  projectPaths: readonly string[],
  structure: ComponentProjectStructure
): readonly string[] {
  const known = new Set(structure.projectPaths)
  const selected = new Set<string>()
  for (const projectPath of projectPaths) {
    if (!known.has(projectPath)) {
      throw new Error(`Неизвестный путь Проекта: ${projectPath}`)
    }
    if (selected.has(projectPath)) {
      throw new Error(`Путь Проекта выбран повторно: ${projectPath}`)
    }
    selected.add(projectPath)
  }
  return projectPaths
}

function requiredHash(hashes: ReadonlyMap<string, bigint>, projectPath: string): bigint {
  const hash = hashes.get(projectPath)
  if (hash === undefined) {
    throw new Error(`Для пути Проекта отсутствует хэш: ${projectPath}`)
  }
  return hash
}

function assertUniqueXmlTargets(plan: FullXmlSyncPlan): void {
  const seen = new Map<string, string>()
  for (const [owner, target] of [
    ...plan.assignments.flatMap((assignment) =>
      assignment.potentialOutputs.map(
        (output) => [assignment.sourceProjectPath, output.targetXmlPath] as const
      )
    ),
    ...plan.externalFiles.map((file) => [file.sourceProjectPath, file.targetXmlPath] as const),
  ]) {
    const previous = seen.get(target)
    if (previous !== undefined) {
      throw new Error(`Повторный XML-путь ${target}: ${previous} и ${owner}`)
    }
    seen.set(target, owner)
  }
}

function compareBySourceProjectPath(
  left: { readonly sourceProjectPath: string },
  right: { readonly sourceProjectPath: string }
): number {
  return Buffer.compare(Buffer.from(left.sourceProjectPath), Buffer.from(right.sourceProjectPath))
}
