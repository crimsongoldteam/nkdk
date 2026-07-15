import { readdirSync } from "fs"
import { isAbsolute, join, relative, resolve, sep } from "path"
import type { ProjectResourceDescriptor, ProjectResourceSource } from "../orchestration/property/fn"
import { CONFIGURATION_YAML_FILE } from "./constants"
import {
  configurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  metadataProjectSpecs,
  type MetadataProjectSpec,
} from "./specs"
import { describeMetadataRuleProjectResources, matchProjectPattern } from "./ruleResources"

const PROPERTIES_FILE = "Свойства.yaml"

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
}

export interface MetadataProjectResourceOnlyRef {
  kind: "resource"
  role: string
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  descriptorKind: ProjectResourceDescriptor["kind"]
  source: ProjectResourceSource
}

export function classifyMetadataProjectPath(projectPath: string): MetadataProjectResourceRef | undefined {
  const normalized = toProjectSeparators(projectPath)
  if (normalized === CONFIGURATION_YAML_FILE) return configurationResource(normalized)

  const parts = normalized.split("/")
  const nestedSubsystem = matchRecursiveNestedPropertiesPath(parts, normalized)
  if (nestedSubsystem) return nestedSubsystem

  const descriptorResource = matchDescriptorResourcePath(parts, normalized)
  if (descriptorResource) return descriptorResource

  return undefined
}

export function discoverMetadataProjectResources(
  projectDir: string,
  options: MetadataProjectResourceDiscoveryOptions = {}
): MetadataProjectResourceRef[] {
  const projectRoot = resolve(projectDir)
  const include = options.include ?? "all"
  const resources: MetadataProjectResourceRef[] = []

  for (const filePath of listProjectFiles(projectRoot)) {
    if (include === "yaml" && !filePath.endsWith(".yaml")) continue

    const projectPath = toProjectSeparators(relative(projectRoot, filePath))
    const resource = classifyMetadataProjectPath(projectPath)
    if (!resource) continue
    if (include === "yaml" && resource.kind !== "yaml") continue

    resources.push({ ...resource, absolutePath: filePath })
  }

  return resources.sort((left, right) => left.projectPath.localeCompare(right.projectPath, "ru"))
}

export function assertMetadataProjectPathInside(projectDir: string, filePath: string): string {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = relative(projectRoot, absolutePath)

  if (projectPath === "" || projectPath.startsWith("..") || isAbsolute(projectPath)) {
    throw new Error("Файл находится вне указанного YAML-проекта")
  }

  return toProjectSeparators(projectPath)
}

export function resolveMetadataProjectResource(
  projectDir: string,
  filePath: string
): MetadataProjectResourceRef | undefined {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = assertMetadataProjectPathInside(projectRoot, absolutePath)
  const resource = classifyMetadataProjectPath(projectPath)

  return resource ? { ...resource, absolutePath } : undefined
}

function configurationResource(projectPath: string): MetadataProjectConfigurationYamlRef {
  return {
    kind: "yaml",
    role: "configuration",
    projectPath,
    owner: {
      dir: "",
      name: "Конфигурация",
      spec: configurationMetadataProjectSpec,
    },
  }
}

function matchRecursiveNestedPropertiesPath(
  parts: string[],
  projectPath: string
): MetadataProjectPropertiesYamlRef | undefined {
  for (const spec of metadataProjectSpecs) {
    const nestingRule = spec.nesting
    if (nestingRule?.kind !== "recursiveChildDir") continue
    if (parts[0] !== spec.dir || parts[parts.length - 1] !== PROPERTIES_FILE) continue
    if (parts.length < 5 || (parts.length - 3) % 2 !== 0) continue
    if (parts.some((part) => part.length === 0)) continue

    const nesting: MetadataProjectNestingSegment[] = [{ dir: spec.dir, name: parts[1] }]
    let matches = true
    for (let index = 2; index < parts.length - 2; index += 2) {
      if (parts[index] !== nestingRule.childDir || !parts[index + 1]) {
        matches = false
        break
      }
      if (index < parts.length - 3) nesting.push({ dir: spec.dir, name: parts[index + 1] })
    }
    if (!matches) continue

    const owner = createOwner(spec.dir, parts[parts.length - 2])
    if (owner) return { kind: "yaml", role: "properties", projectPath, owner, nesting }
  }

  return undefined
}

function matchDescriptorResourcePath(parts: string[], projectPath: string): MetadataProjectResourceRef | undefined {
  if (parts.length < 3) return undefined
  const owner = createOwner(parts[0], parts[1])
  if (!owner) return undefined

  const relativePath = parts.slice(2).join("/")
  for (const resource of describeMetadataRuleProjectResources(owner.spec.rule)) {
    const match = matchProjectPattern(resource.projectPattern, relativePath)
    if (!match) continue
    if (resource.kind !== "yaml") {
      return {
        kind: "resource",
        role: resource.role,
        projectPath,
        owner,
        descriptorKind: resource.kind,
        source: resource.source,
      }
    }
    if (resource.role === "resourceOnly") {
      return {
        kind: "resource",
        role: resource.role,
        projectPath,
        owner,
        descriptorKind: resource.kind,
        source: resource.source,
      }
    }

    if (resource.role === "properties") {
      return { kind: "yaml", role: "properties", projectPath, owner, nesting: [] }
    }
    if (resource.role === "fileItem" && match.itemName && resource.projectPattern.endsWith("/Форма.yaml")) {
      return { kind: "yaml", role: "form", projectPath, owner, formName: match.itemName }
    }
  }

  return undefined
}

function createOwner(dir: string | undefined, name: string | undefined): MetadataProjectResourceOwner | undefined {
  if (!dir || !name) return undefined

  const spec = getMetadataProjectSpecByDir(dir)
  if (!spec) return undefined

  return { dir, name, spec }
}

function listProjectFiles(projectRoot: string): string[] {
  const files: string[] = []
  collectProjectFiles(projectRoot, files)
  return files
}

function collectProjectFiles(currentDir: string, files: string[]): void {
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    const entryPath = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      collectProjectFiles(entryPath, files)
      continue
    }
    if (entry.isFile()) files.push(entryPath)
  }
}

function toProjectSeparators(filePath: string): string {
  return filePath.split(sep).join("/")
}
