import { posix } from "path"
import { childUid, configurationUid, metadataItemUid } from "../configurationIndex/logicalAddress"
import {
  discoverMetadataProjectResources,
  type MetadataProjectResourceRef,
} from "../project/resources"
import {
  describeMetadataRuleXmlSyncRoutes,
  expandProjectPattern,
  matchProjectPattern,
} from "../project/ruleResources"
import type { XmlSyncRoute } from "../orchestration/property/fn"
import type { FullXmlSyncAssignment, FullXmlSyncExternalFile, FullXmlSyncPlan } from "./types"

export interface BuildFullXmlSyncPlanOptions {
  readonly projectDir: string
  readonly extraAssignments?: readonly FullXmlSyncAssignment[]
}

export async function buildFullXmlSyncPlan(options: BuildFullXmlSyncPlanOptions): Promise<FullXmlSyncPlan> {
  const resources = await discoverMetadataProjectResources(options.projectDir)
  const assignments = resources
    .filter((resource) => resource.kind === "yaml")
    .map((resource) => assignmentForYaml(resource))
    .filter((assignment): assignment is FullXmlSyncAssignment => assignment !== undefined)
  const externalFiles = resources
    .filter((resource) => resource.kind === "resource")
    .map((resource) => externalFileForResource(resource))
    .filter((file): file is FullXmlSyncExternalFile => file !== undefined)

  const plan = {
    assignments: [...assignments, ...(options.extraAssignments ?? [])].sort(compareBySourceProjectPath),
    externalFiles: externalFiles.sort(compareBySourceProjectPath),
  }
  assertUniqueXmlTargets(plan)
  return plan
}

function assignmentForYaml(resource: Extract<MetadataProjectResourceRef, { kind: "yaml" }>): FullXmlSyncAssignment | undefined {
  if (resource.role === "configuration") {
    return {
      id: resource.projectPath,
      sourceProjectPath: resource.projectPath,
      sourcePath: resource.absolutePath ?? resource.projectPath,
      role: "configuration",
      itemType: resource.owner.spec.rule.itemType,
      itemName: resource.owner.name,
      logicalAddress: configurationUid(),
      outputs: [{ routeKind: "owner", targetXmlPath: "Configuration.xml" }],
    }
  }

  if (resource.role === "properties") {
    const route = ownerRouteFor(resource)
    if (route === undefined) return undefined
    const ownerAddress = ownerLogicalAddress(resource)
    return {
      id: resource.projectPath,
      sourceProjectPath: resource.projectPath,
      sourcePath: resource.absolutePath ?? resource.projectPath,
      role: "properties",
      itemType: resource.owner.spec.rule.itemType,
      itemName: resource.owner.name,
      logicalAddress: ownerAddress,
      outputs: [{ routeKind: "owner", targetXmlPath: expandOwnerRoute(route, resource) }],
    }
  }

  const route = childRouteFor(resource, "fileItem")
  if (route === undefined) return undefined
  const ownerAddress = ownerLogicalAddress(resource)
  return {
    id: resource.projectPath,
    sourceProjectPath: resource.projectPath,
    sourcePath: resource.absolutePath ?? resource.projectPath,
    role: "form",
    itemType: resource.itemType,
    itemName: resource.formName,
    logicalAddress: childUid(ownerAddress, "Форма", resource.formName),
    owner: {
      itemType: resource.owner.spec.rule.itemType,
      name: resource.owner.name,
      logicalAddress: ownerAddress,
    },
    outputs: [{ routeKind: "fileItem", targetXmlPath: expandChildRoute(route, resource) }],
  }
}

function externalFileForResource(
  resource: Extract<MetadataProjectResourceRef, { kind: "resource" }>
): FullXmlSyncExternalFile | undefined {
  const route = childRouteFor(resource, "externalFile")
  if (route === undefined) return undefined
  return {
    sourceProjectPath: resource.projectPath,
    sourcePath: resource.absolutePath ?? resource.projectPath,
    targetXmlPath: expandChildRoute(route, resource),
  }
}

function ownerRouteFor(resource: MetadataProjectResourceRef): Extract<XmlSyncRoute, { kind: "owner" }> | undefined {
  const tail = projectTail(resource)
  return describeMetadataRuleXmlSyncRoutes(resource.owner.spec.rule).find(
    (route): route is Extract<XmlSyncRoute, { kind: "owner" }> =>
      route.kind === "owner" && matchProjectPattern(route.yamlPattern, tail) !== undefined
  )
}

function childRouteFor(
  resource: MetadataProjectResourceRef,
  kind: "fileItem" | "externalFile"
): Extract<XmlSyncRoute, { kind: "fileItem" | "externalFile" }> | undefined {
  const tail = projectTail(resource)
  return describeMetadataRuleXmlSyncRoutes(resource.owner.spec.rule).find(
    (route): route is Extract<XmlSyncRoute, { kind: "fileItem" | "externalFile" }> =>
      route.kind === kind && matchProjectPattern(route.yamlPattern, tail) !== undefined
  )
}

function expandOwnerRoute(route: Extract<XmlSyncRoute, { kind: "owner" }>, resource: MetadataProjectResourceRef): string {
  return expandProjectPattern(route.xmlPathPattern, { ownerName: resource.owner.name })
}

function expandChildRoute(
  route: Extract<XmlSyncRoute, { kind: "fileItem" | "externalFile" }>,
  resource: MetadataProjectResourceRef
): string {
  const params = matchProjectPattern(route.yamlPattern, projectTail(resource)) ?? {}
  const rule = resource.owner.spec.rule
  return posix.join(
    rule.xmlDir ?? "",
    resource.owner.name,
    expandProjectPattern(route.xmlPathPattern, {
      ...params,
      ownerName: resource.owner.name,
      dumpRoot: "",
    })
  )
}

function projectTail(resource: MetadataProjectResourceRef): string {
  if (resource.owner.dir === "") return resource.projectPath
  const prefix = `${resource.owner.dir}/${resource.owner.name}/`
  return resource.projectPath.startsWith(prefix) ? resource.projectPath.slice(prefix.length) : resource.projectPath
}

function ownerLogicalAddress(resource: MetadataProjectResourceRef): string {
  return metadataItemUid(resource.owner.dir, resource.owner.name)
}

function assertUniqueXmlTargets(plan: FullXmlSyncPlan): void {
  const seen = new Map<string, string>()
  for (const [owner, target] of [
    ...plan.assignments.flatMap((assignment) =>
      assignment.outputs.map((output) => [assignment.sourceProjectPath, output.targetXmlPath] as const)
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
