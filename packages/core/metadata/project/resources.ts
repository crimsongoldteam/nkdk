import { existsSync, readdirSync, statSync } from "fs"
import { isAbsolute, join, relative, resolve, sep } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import {
  configurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  metadataProjectSpecs,
  type MetadataProjectSpec,
} from "./specs"

const SUBSYSTEM_DIR = "Подсистема"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"
const PROPERTIES_FILE = "Свойства.yaml"
const FORM_FILE = "Форма.yaml"

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
  const nestedSubsystem = matchNestedSubsystemPropertiesPath(parts, normalized)
  if (nestedSubsystem) return nestedSubsystem

  const properties = matchPropertiesPath(parts, normalized)
  if (properties) return properties

  const form = matchFormPath(parts, normalized)
  if (form) return form

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

      collectExistingProjectResource(projectRoot, join(kindDir, ownerEntry.name, PROPERTIES_FILE), resources)

      const formsDir = join(kindDir, ownerEntry.name, "Формы")
      if (!isExistingDirectory(formsDir)) continue

      for (const formEntry of readdirSync(formsDir, { withFileTypes: true })) {
        if (!formEntry.isDirectory()) continue
        collectExistingProjectResource(projectRoot, join(formsDir, formEntry.name, FORM_FILE), resources)
      }
    }
  }

  collectNestedSubsystemPropertyResources(projectRoot, resources)

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
  filePath: string,
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
  resources: MetadataProjectResourceRef[],
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

function matchPropertiesPath(parts: string[], projectPath: string): MetadataProjectPropertiesYamlRef | undefined {
  if (parts.length !== 3 || parts[2] !== PROPERTIES_FILE) return undefined

  const owner = createOwner(parts[0], parts[1])
  return owner ? { kind: "yaml", role: "properties", projectPath, owner, nesting: [] } : undefined
}

function matchNestedSubsystemPropertiesPath(
  parts: string[],
  projectPath: string,
): MetadataProjectPropertiesYamlRef | undefined {
  const lastPart = parts[parts.length - 1]
  if (parts.length < 5 || parts[0] !== SUBSYSTEM_DIR || lastPart !== PROPERTIES_FILE) return undefined
  if ((parts.length - 3) % 2 !== 0) return undefined
  if (parts.some((part) => part.length === 0)) return undefined

  const nesting: MetadataProjectNestingSegment[] = [{ dir: SUBSYSTEM_DIR, name: parts[1] }]
  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== CHILD_SUBSYSTEMS_DIR || !parts[index + 1]) return undefined
    if (index < parts.length - 3) nesting.push({ dir: SUBSYSTEM_DIR, name: parts[index + 1] })
  }

  const owner = createOwner(SUBSYSTEM_DIR, parts[parts.length - 2])
  return owner ? { kind: "yaml", role: "properties", projectPath, owner, nesting } : undefined
}

function matchFormPath(parts: string[], projectPath: string): MetadataProjectFormYamlRef | undefined {
  if (parts.length !== 5 || parts[2] !== "Формы" || parts[4] !== FORM_FILE) return undefined

  const owner = createOwner(parts[0], parts[1])
  const formName = parts[3]
  if (!owner || !formName) return undefined

  return { kind: "yaml", role: "form", projectPath, owner, formName }
}

function createOwner(dir: string | undefined, name: string | undefined): MetadataProjectResourceOwner | undefined {
  if (!dir || !name) return undefined

  const spec = getMetadataProjectSpecByDir(dir)
  if (!spec) return undefined

  return { dir, name, spec }
}

function collectNestedSubsystemPropertyResources(projectRoot: string, resources: MetadataProjectResourceRef[]): void {
  const subsystemRoot = join(projectRoot, SUBSYSTEM_DIR)
  if (!isExistingDirectory(subsystemRoot)) return

  for (const subsystemEntry of readdirSync(subsystemRoot, { withFileTypes: true })) {
    if (!subsystemEntry.isDirectory()) continue
    collectNestedSubsystemPropertyResourcesFromDir(projectRoot, join(subsystemRoot, subsystemEntry.name), resources)
  }
}

function collectNestedSubsystemPropertyResourcesFromDir(
  projectRoot: string,
  currentDir: string,
  resources: MetadataProjectResourceRef[],
): void {
  const childSubsystemsDir = join(currentDir, CHILD_SUBSYSTEMS_DIR)
  if (!isExistingDirectory(childSubsystemsDir)) return

  for (const childEntry of readdirSync(childSubsystemsDir, { withFileTypes: true })) {
    if (!childEntry.isDirectory()) continue

    const childDir = join(childSubsystemsDir, childEntry.name)
    collectExistingProjectResource(projectRoot, join(childDir, PROPERTIES_FILE), resources)
    collectNestedSubsystemPropertyResourcesFromDir(projectRoot, childDir, resources)
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
