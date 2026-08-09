import { isAbsolute, resolve } from "path"
import {
  classifyMetadataProjectPath as classifyTopologyProjectPath,
  discoverMetadataProjectResources as discoverTopologyProjectResources,
  iterateMetadataProjectPathCandidates as iterateTopologyProjectPathCandidates,
  projectMetadataFileBackedTargets,
  type MetadataFileBackedTargetContribution,
  type MetadataProjectResourceMatch,
} from "../resourceTopology/projectProjection"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import type { CompiledMetadataResourceTopology, MetadataResourceSource } from "../resourceTopology/types"
import { configurationMetadataProjectSpec, getMetadataProjectSpecByDir, type MetadataProjectSpec } from "./specs"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { projectPathFromFileSystem } from "./path"

export type MetadataProjectResourceKind = "yaml" | "resource"
export type MetadataProjectResourceInclude = "all" | "yaml"
export type MetadataProjectYamlRole = "configuration" | "properties" | "form"

export interface MetadataProjectResourceDiscoveryOptions {
  include?: MetadataProjectResourceInclude
}

export interface MetadataProjectResourceContext {
  topology: CompiledMetadataResourceTopology
  rootSpec: MetadataProjectSpec
}

export interface MetadataProjectResourceCandidate {
  readonly projectPath: string
  readonly absolutePath: string
  classify(): MetadataProjectResourceRef | undefined
}

export interface MetadataProjectResourceOwner {
  dir: string
  name: string
  spec: MetadataProjectSpec
}

export interface MetadataProjectNestingSegment {
  dir: string
  name: string
}

export type MetadataProjectResourceRef =
  | MetadataProjectConfigurationYamlRef
  | MetadataProjectPropertiesYamlRef
  | MetadataProjectFormYamlRef
  | MetadataProjectResourceOnlyRef

export interface MetadataProjectResourceTargetRef {
  readonly fileBackedTargets: readonly MetadataFileBackedTargetContribution[]
}

export interface MetadataProjectStateTargetRef {
  readonly kind: "member"
  readonly canonical: string
  readonly fileBacked: {
    readonly itemProjectPath: string
    readonly ownerProjectPath: string
  }
}

export function projectStateFileBackedTargets(
  componentPath: string,
  contributions: readonly MetadataFileBackedTargetContribution[],
): readonly MetadataProjectStateTargetRef[] {
  return contributions.map((contribution) => ({
    kind: contribution.kind,
    canonical: [
      contribution.owner.root,
      contribution.owner.objectName,
      contribution.memberKind,
      contribution.itemName,
    ].join("."),
    fileBacked: {
      itemProjectPath: `${componentPath}/${contribution.itemProjectPath}`,
      ownerProjectPath: `${componentPath}/${contribution.ownerProjectPath}`,
    },
  }))
}

export interface MetadataProjectConfigurationYamlRef extends MetadataProjectResourceTargetRef {
  kind: "yaml"
  role: "configuration"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
}

export interface MetadataProjectPropertiesYamlRef extends MetadataProjectResourceTargetRef {
  kind: "yaml"
  role: "properties"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  nesting: MetadataProjectNestingSegment[]
}

export interface MetadataProjectFormYamlRef extends MetadataProjectResourceTargetRef {
  kind: "yaml"
  role: "form"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  formName: string
  itemType: string
  itemRule: MetadataItemRule
}

export interface MetadataProjectResourceOnlyRef extends MetadataProjectResourceTargetRef {
  kind: "resource"
  role: string
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  descriptorKind: "externalFile"
  source: MetadataResourceSource
}

export function classifyMetadataProjectPath(
  projectPath: string,
  context: MetadataProjectResourceContext = defaultResourceContext()
): MetadataProjectResourceRef | undefined {
  const match = classifyTopologyProjectPath(context.topology, projectPath)
  return match === undefined || match.kind === "ignore" ? undefined : toLegacyResource(match, context)
}

export async function discoverMetadataProjectResources(
  projectDir: string,
  options: MetadataProjectResourceDiscoveryOptions = {},
  context: MetadataProjectResourceContext = defaultResourceContext()
): Promise<MetadataProjectResourceRef[]> {
  const matches = await discoverTopologyProjectResources({
    topology: context.topology,
    projectDir,
    include: options.include === "yaml" ? "content" : "all",
    sort: false,
  })
  return matches
    .map((match) => ({
      ...toLegacyResource(match, context),
      absolutePath: resolve(projectDir, ...match.projectPath.split("/")),
    }))
    .sort((left, right) => left.projectPath.localeCompare(right.projectPath, "ru"))
}

export async function* iterateMetadataProjectResources(
  projectDir: string,
  options: MetadataProjectResourceDiscoveryOptions = {},
  context: MetadataProjectResourceContext = defaultResourceContext(),
): AsyncGenerator<MetadataProjectResourceRef> {
  for await (const candidate of iterateMetadataProjectResourceCandidates(projectDir, options, context)) {
    const resource = candidate.classify()
    if (resource !== undefined) yield resource
  }
}

export async function* iterateMetadataProjectResourceCandidates(
  projectDir: string,
  options: MetadataProjectResourceDiscoveryOptions = {},
  context: MetadataProjectResourceContext = defaultResourceContext(),
): AsyncGenerator<MetadataProjectResourceCandidate> {
  for await (const candidate of iterateTopologyProjectPathCandidates({
    topology: context.topology,
    projectDir,
    include: options.include === "yaml" ? "content" : "all",
  })) {
    let classified = false
    let cached: MetadataProjectResourceRef | undefined
    yield {
      projectPath: candidate.projectPath,
      absolutePath: candidate.absolutePath,
      classify() {
        if (!classified) {
          const match = candidate.classify()
          cached = match === undefined || match.kind === "ignore"
            ? undefined
            : { ...toLegacyResource(match, context), absolutePath: candidate.absolutePath }
          classified = true
        }
        return cached
      },
    }
  }
}

export function assertMetadataProjectPathInside(projectDir: string, filePath: string): string {
  try {
    return projectPathFromFileSystem(projectDir, filePath)
  } catch {
    throw new Error("Файл находится вне указанного YAML-проекта")
  }
}

export function resolveMetadataProjectResource(
  projectDir: string,
  filePath: string,
  context: MetadataProjectResourceContext = defaultResourceContext()
): MetadataProjectResourceRef | undefined {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = assertMetadataProjectPathInside(projectRoot, absolutePath)
  const resource = classifyMetadataProjectPath(projectPath, context)
  return resource === undefined ? undefined : { ...resource, absolutePath }
}

function toLegacyResource(
  match: MetadataProjectResourceMatch,
  context: MetadataProjectResourceContext
): MetadataProjectResourceRef {
  const fileBackedTargets = projectMetadataFileBackedTargets(context.topology, match)
  if (match.kind === "content" && match.assignment?.role === "configuration") {
    return {
      kind: "yaml",
      role: "configuration",
      projectPath: match.projectPath,
      fileBackedTargets,
      owner: { dir: "", name: "Конфигурация", spec: context.rootSpec },
    }
  }

  if (match.kind === "content" && match.assignment?.role === "properties") {
    const owner = legacyOwner(match)
    return {
      kind: "yaml",
      role: "properties",
      projectPath: match.projectPath,
      fileBackedTargets,
      owner,
      nesting: nestingSegments(match, owner.dir),
    }
  }
  if (match.kind === "content" && match.assignment?.role === "fileItem") {
    return {
      kind: "yaml",
      role: "form",
      projectPath: match.projectPath,
      fileBackedTargets,
      owner: rootOwner(match, context),
      formName: lastItemName(match.values),
      itemType: match.assignment.itemRule.itemType,
      itemRule: match.assignment.itemRule,
    }
  }
  return {
    kind: "resource",
    role: "resourceOnly",
    projectPath: match.projectPath,
    fileBackedTargets,
    owner: rootOwner(match, context),
    descriptorKind: "externalFile",
    source: match.externalFile?.source ?? {
      kind: "itemRule",
      description: match.assignment?.itemRule.itemType ?? "resource",
    },
  }
}

function legacyOwner(match: MetadataProjectResourceMatch): MetadataProjectResourceOwner {
  const dir = match.projectPath.split("/")[0] ?? ""
  const spec = getMetadataProjectSpecByDir(dir)
  if (spec === undefined) throw new Error(`Не найден project spec для ${match.projectPath}`)
  return {
    dir,
    name: lastOwnerName(match.values),
    spec,
  }
}

function rootOwner(
  match: MetadataProjectResourceMatch,
  context: MetadataProjectResourceContext
): MetadataProjectResourceOwner {
  if (match.assignment?.role === "configuration") {
    return { dir: "", name: "Конфигурация", spec: context.rootSpec }
  }
  const dir = match.projectPath.split("/")[0] ?? ""
  const spec = getMetadataProjectSpecByDir(dir)
  if (spec === undefined) throw new Error(`Не найден project spec для ${match.projectPath}`)
  return { dir, name: match.values.ownerName ?? match.projectPath.split("/")[1] ?? "", spec }
}

function defaultResourceContext(): MetadataProjectResourceContext {
  return {
    topology: compileRegisteredMetadataResourceTopology(),
    rootSpec: configurationMetadataProjectSpec,
  }
}

function lastOwnerName(values: Readonly<Record<string, string>>): string {
  const recursive = Object.entries(values)
    .filter(([key]) => /^recursiveItemName\d+$/.test(key))
    .sort(([left], [right]) => Number(left.replace(/\D/g, "")) - Number(right.replace(/\D/g, "")))
    .at(-1)?.[1]
  return recursive ?? values.ownerName ?? values.itemName ?? ""
}

function lastItemName(values: Readonly<Record<string, string>>): string {
  const items = Object.entries(values)
    .filter(([key]) => /^itemName\d*$/.test(key))
    .sort(([left], [right]) => itemIndex(left) - itemIndex(right))
  return items.at(-1)?.[1] ?? lastOwnerName(values)
}

function itemIndex(key: string): number {
  const suffix = key.replace("itemName", "")
  return suffix === "" ? 1 : Number(suffix)
}

function nestingSegments(match: MetadataProjectResourceMatch, dir: string): MetadataProjectNestingSegment[] {
  const recursive = Object.entries(match.values)
    .filter(([key]) => /^recursiveItemName\d+$/.test(key))
    .sort(([left], [right]) => Number(left.replace(/\D/g, "")) - Number(right.replace(/\D/g, "")))
  if (recursive.length === 0) return []
  return [
    ...(match.values.ownerName === undefined ? [] : [{ dir, name: match.values.ownerName }]),
    ...recursive.slice(0, -1).map(([, name]) => ({ dir, name })),
  ]
}
