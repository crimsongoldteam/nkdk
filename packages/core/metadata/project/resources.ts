import { existsSync, readdirSync, statSync } from "fs"
import { isAbsolute, join, relative, resolve, sep } from "path"
import { CONFIGURATION_YAML_FILE } from "./constants"
import {
  configurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  metadataProjectSpecs,
  type MetadataProjectSpec,
} from "./specs"
import { describeMetadataRuleProjectResources, matchProjectPattern } from "./ruleResources"

const PROPERTIES_FILE = "Свойства.yaml"

export type MetadataProjectResourceKind = "yaml" | "xml" | "asset"
export type MetadataProjectYamlRole = "configuration" | "properties" | "form"

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

export function discoverMetadataProjectResources(projectDir: string): MetadataProjectResourceRef[] {
  const projectRoot = resolve(projectDir)
  const resources: MetadataProjectResourceRef[] = []

  collectExistingProjectResource(projectRoot, join(projectRoot, CONFIGURATION_YAML_FILE), resources)

  for (const spec of metadataProjectSpecs) {
    const kindDir = join(projectRoot, spec.dir)
    if (!isExistingDirectory(kindDir)) continue

    for (const ownerEntry of readdirSync(kindDir, { withFileTypes: true })) {
      if (!ownerEntry.isDirectory()) continue

      collectExistingDescriptorResources(projectRoot, join(kindDir, ownerEntry.name), spec, resources)
    }
  }

  collectNestedRecursivePropertyResources(projectRoot, resources)

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

function collectExistingProjectResource(
  projectRoot: string,
  filePath: string,
  resources: MetadataProjectResourceRef[]
): void {
  if (!isExistingFile(filePath)) return

  const resource = resolveMetadataProjectResource(projectRoot, filePath)
  if (resource) resources.push(resource)
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

function matchDescriptorResourcePath(
  parts: string[],
  projectPath: string
): MetadataProjectPropertiesYamlRef | MetadataProjectFormYamlRef | undefined {
  if (parts.length < 3) return undefined
  const owner = createOwner(parts[0], parts[1])
  if (!owner) return undefined

  const relativePath = parts.slice(2).join("/")
  for (const resource of describeMetadataRuleProjectResources(owner.spec.rule)) {
    const match = matchProjectPattern(resource.projectPattern, relativePath)
    if (!match || resource.kind !== "yaml") continue

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

function collectExistingDescriptorResources(
  projectRoot: string,
  ownerRoot: string,
  spec: MetadataProjectSpec,
  resources: MetadataProjectResourceRef[]
): void {
  for (const resource of describeMetadataRuleProjectResources(spec.rule)) {
    if (resource.kind !== "yaml") continue
    collectExistingResourcePattern(projectRoot, ownerRoot, resource.projectPattern, resources)
  }
}

function collectExistingResourcePattern(
  projectRoot: string,
  ownerRoot: string,
  projectPattern: string,
  resources: MetadataProjectResourceRef[]
): void {
  const placeholderMatch = projectPattern.match(/^(.*)\/\{itemName\}\/([^/]+)$/)
  if (!placeholderMatch) {
    collectExistingProjectResource(projectRoot, join(ownerRoot, ...projectPattern.split("/")), resources)
    return
  }

  const [, dirPattern, fileName] = placeholderMatch
  const itemsDir = join(ownerRoot, ...dirPattern.split("/"))
  if (!isExistingDirectory(itemsDir)) return

  for (const childEntry of readdirSync(itemsDir, { withFileTypes: true })) {
    if (!childEntry.isDirectory()) continue
    collectExistingProjectResource(projectRoot, join(itemsDir, childEntry.name, fileName), resources)
  }
}

function collectNestedRecursivePropertyResources(projectRoot: string, resources: MetadataProjectResourceRef[]): void {
  for (const spec of metadataProjectSpecs) {
    if (spec.nesting?.kind !== "recursiveChildDir") continue
    const root = join(projectRoot, spec.dir)
    if (!isExistingDirectory(root)) continue

    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      collectNestedRecursivePropertyResourcesFromDir(projectRoot, join(root, entry.name), spec, resources)
    }
  }
}

function collectNestedRecursivePropertyResourcesFromDir(
  projectRoot: string,
  currentDir: string,
  spec: MetadataProjectSpec,
  resources: MetadataProjectResourceRef[]
): void {
  const childDir = join(currentDir, spec.nesting?.childDir ?? "")
  if (!isExistingDirectory(childDir)) return

  for (const childEntry of readdirSync(childDir, { withFileTypes: true })) {
    if (!childEntry.isDirectory()) continue

    const nestedDir = join(childDir, childEntry.name)
    collectExistingProjectResource(projectRoot, join(nestedDir, PROPERTIES_FILE), resources)
    collectNestedRecursivePropertyResourcesFromDir(projectRoot, nestedDir, spec, resources)
  }
}

function toProjectSeparators(filePath: string): string {
  return filePath.split(sep).join("/")
}

function isExistingDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory()
}

function isExistingFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile()
}
