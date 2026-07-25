import { isAbsolute, resolve, relative } from "path"
import {
  classifyMetadataProjectPath as classifyTopologyProjectPath,
  discoverMetadataProjectResources as discoverTopologyProjectResources,
  type MetadataProjectResourceMatch,
} from "../resourceTopology/projectProjection"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import type { MetadataResourceSource } from "../resourceTopology/types"
import { configurationMetadataProjectSpec, getMetadataProjectSpecByDir, type MetadataProjectSpec } from "./specs"

export type MetadataProjectResourceKind = "yaml" | "resource"
export type MetadataProjectResourceInclude = "all" | "yaml"
export type MetadataProjectYamlRole = "configuration" | "properties" | "form"

export interface MetadataProjectResourceDiscoveryOptions {
  include?: MetadataProjectResourceInclude
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

export interface MetadataProjectConfigurationYamlRef {
  kind: "yaml"
  role: "configuration"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
}

export interface MetadataProjectPropertiesYamlRef {
  kind: "yaml"
  role: "properties"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  nesting: MetadataProjectNestingSegment[]
}

export interface MetadataProjectFormYamlRef {
  kind: "yaml"
  role: "form"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  formName: string
  itemType: string
}

export interface MetadataProjectResourceOnlyRef {
  kind: "resource"
  role: string
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  descriptorKind: "externalFile"
  source: MetadataResourceSource
}

export function classifyMetadataProjectPath(projectPath: string): MetadataProjectResourceRef | undefined {
  const topology = compileRegisteredMetadataResourceTopology()
  const match = classifyTopologyProjectPath(topology, projectPath)
  return match === undefined || match.kind === "ignore" ? undefined : toLegacyResource(match)
}

export async function discoverMetadataProjectResources(
  projectDir: string,
  options: MetadataProjectResourceDiscoveryOptions = {}
): Promise<MetadataProjectResourceRef[]> {
  const topology = compileRegisteredMetadataResourceTopology()
  const matches = await discoverTopologyProjectResources({
    topology,
    projectDir,
    include: options.include === "yaml" ? "content" : "all",
  })
  return matches.map((match) => ({
    ...toLegacyResource(match),
    absolutePath: resolve(projectDir, ...match.projectPath.split("/")),
  })).sort((left, right) => left.projectPath.localeCompare(right.projectPath, "ru"))
}

export function assertMetadataProjectPathInside(projectDir: string, filePath: string): string {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = relative(projectRoot, absolutePath)
  if (projectPath === "" || projectPath.startsWith("..") || isAbsolute(projectPath)) {
    throw new Error("Файл находится вне указанного YAML-проекта")
  }
  return projectPath.replace(/\\/g, "/")
}

export function resolveMetadataProjectResource(
  projectDir: string,
  filePath: string
): MetadataProjectResourceRef | undefined {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = assertMetadataProjectPathInside(projectRoot, absolutePath)
  const resource = classifyMetadataProjectPath(projectPath)
  return resource === undefined ? undefined : { ...resource, absolutePath }
}

function toLegacyResource(match: MetadataProjectResourceMatch): MetadataProjectResourceRef {
  if (match.kind === "content" && match.assignment?.role === "configuration") {
    return {
      kind: "yaml",
      role: "configuration",
      projectPath: match.projectPath,
      owner: { dir: "", name: "Конфигурация", spec: configurationMetadataProjectSpec },
    }
  }

  const owner = legacyOwner(match)
  if (match.kind === "content" && match.assignment?.role === "properties") {
    return {
      kind: "yaml",
      role: "properties",
      projectPath: match.projectPath,
      owner,
      nesting: nestingSegments(match, owner.dir),
    }
  }
  if (match.kind === "content" && match.assignment?.role === "fileItem") {
    return {
      kind: "yaml",
      role: "form",
      projectPath: match.projectPath,
      owner: rootOwner(match),
      formName: lastItemName(match.values),
      itemType: match.assignment.itemRule.itemType,
    }
  }
  return {
    kind: "resource",
    role: "resourceOnly",
    projectPath: match.projectPath,
    owner: rootOwner(match),
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

function rootOwner(match: MetadataProjectResourceMatch): MetadataProjectResourceOwner {
  const dir = match.projectPath.split("/")[0] ?? ""
  const spec = getMetadataProjectSpecByDir(dir)
  if (spec === undefined) throw new Error(`Не найден project spec для ${match.projectPath}`)
  return { dir, name: match.values.ownerName ?? match.projectPath.split("/")[1] ?? "", spec }
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

function nestingSegments(
  match: MetadataProjectResourceMatch,
  dir: string
): MetadataProjectNestingSegment[] {
  const recursive = Object.entries(match.values)
    .filter(([key]) => /^recursiveItemName\d+$/.test(key))
    .sort(([left], [right]) => Number(left.replace(/\D/g, "")) - Number(right.replace(/\D/g, "")))
  if (recursive.length === 0) return []
  return [
    ...(match.values.ownerName === undefined ? [] : [{ dir, name: match.values.ownerName }]),
    ...recursive.slice(0, -1).map(([, name]) => ({ dir, name })),
  ]
}
