import { existsSync, readdirSync, statSync } from "fs"
import { isAbsolute, join, relative, resolve, sep } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import {
  configurationValidationProjectSpec,
  getValidationProjectSpecByDir,
  validationProjectSpecs,
  type ValidationProjectSpec,
} from "./projectSpecs"

const SUBSYSTEM_DIR = "Подсистема"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"
const PROPERTIES_FILE = "Свойства.yaml"
const FORM_FILE = "Форма.yaml"

export interface ValidationProjectFile {
  absolutePath: string
  projectPath: string
  kind: "configuration" | "properties" | "form"
  owner: { dir: string; name: string; spec: ValidationProjectSpec }
  formName?: string
}

export function discoverValidationProjectFiles(projectDir: string): ValidationProjectFile[] {
  const projectRoot = resolve(projectDir)
  const files: ValidationProjectFile[] = []

  const configurationPath = join(projectRoot, CONFIGURATION_YAML_FILE)
  const configurationFile = collectExistingProjectFile(projectRoot, configurationPath)
  if (configurationFile) files.push(configurationFile)

  for (const spec of validationProjectSpecs) {
    const kindDir = join(projectRoot, spec.dir)
    if (!isExistingDirectory(kindDir)) continue

    for (const ownerEntry of readdirSync(kindDir, { withFileTypes: true })) {
      if (!ownerEntry.isDirectory()) continue

      const propertiesPath = join(kindDir, ownerEntry.name, PROPERTIES_FILE)
      const propertiesFile = collectExistingProjectFile(projectRoot, propertiesPath)
      if (propertiesFile) files.push(propertiesFile)

      const formsDir = join(kindDir, ownerEntry.name, "Формы")
      if (!isExistingDirectory(formsDir)) continue

      for (const formEntry of readdirSync(formsDir, { withFileTypes: true })) {
        if (!formEntry.isDirectory()) continue

        const formPath = join(formsDir, formEntry.name, FORM_FILE)
        const formFile = collectExistingProjectFile(projectRoot, formPath)
        if (formFile) files.push(formFile)
      }
    }
  }

  collectNestedSubsystemPropertyFiles(projectRoot, files)

  return files.sort((left, right) => left.projectPath.localeCompare(right.projectPath, "ru"))
}

export function resolveValidationProjectFile(projectDir: string, filePath: string): ValidationProjectFile | undefined {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = assertProjectFileInside(projectRoot, absolutePath)

  if (projectPath === CONFIGURATION_YAML_FILE) {
    return {
      absolutePath,
      projectPath,
      kind: "configuration",
      owner: {
        dir: "",
        name: "Конфигурация",
        spec: configurationValidationProjectSpec,
      },
    }
  }

  const parts = projectPath.split("/")

  const nestedSubsystemOwner = matchNestedSubsystemPropertiesPath(parts)
  if (nestedSubsystemOwner) {
    return {
      absolutePath,
      projectPath,
      kind: "properties",
      owner: nestedSubsystemOwner,
    }
  }

  const propertiesOwner = matchPropertiesPath(parts)
  if (propertiesOwner) {
    return {
      absolutePath,
      projectPath,
      kind: "properties",
      owner: propertiesOwner,
    }
  }

  const formOwner = matchFormPath(parts)
  if (formOwner) {
    return {
      absolutePath,
      projectPath,
      kind: "form",
      owner: formOwner.owner,
      formName: formOwner.formName,
    }
  }

  return undefined
}

export function assertProjectFileInside(projectDir: string, filePath: string): string {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = relative(projectRoot, absolutePath)

  if (projectPath === "" || projectPath.startsWith("..") || isAbsolute(projectPath)) {
    throw new Error("Файл находится вне указанного YAML-проекта")
  }

  return toProjectSeparators(projectPath)
}

function collectNestedSubsystemPropertyFiles(projectRoot: string, files: ValidationProjectFile[]): void {
  const subsystemRoot = join(projectRoot, SUBSYSTEM_DIR)
  if (!isExistingDirectory(subsystemRoot)) return

  for (const subsystemEntry of readdirSync(subsystemRoot, { withFileTypes: true })) {
    if (!subsystemEntry.isDirectory()) continue

    collectNestedSubsystemPropertyFilesFromDir(projectRoot, join(subsystemRoot, subsystemEntry.name), files)
  }
}

function collectNestedSubsystemPropertyFilesFromDir(
  projectRoot: string,
  currentDir: string,
  files: ValidationProjectFile[],
): void {
  const childSubsystemsDir = join(currentDir, CHILD_SUBSYSTEMS_DIR)
  if (!isExistingDirectory(childSubsystemsDir)) return

  for (const childEntry of readdirSync(childSubsystemsDir, { withFileTypes: true })) {
    if (!childEntry.isDirectory()) continue

    const childDir = join(childSubsystemsDir, childEntry.name)
    const propertiesFile = collectExistingProjectFile(projectRoot, join(childDir, PROPERTIES_FILE))
    if (propertiesFile) files.push(propertiesFile)

    collectNestedSubsystemPropertyFilesFromDir(projectRoot, childDir, files)
  }
}

function collectExistingProjectFile(projectRoot: string, filePath: string): ValidationProjectFile | undefined {
  if (!isExistingFile(filePath)) return undefined

  return resolveValidationProjectFile(projectRoot, filePath)
}

function matchPropertiesPath(parts: string[]): ValidationProjectFile["owner"] | undefined {
  if (parts.length !== 3 || parts[2] !== PROPERTIES_FILE) return undefined

  return createOwner(parts[0], parts[1])
}

function matchNestedSubsystemPropertiesPath(parts: string[]): ValidationProjectFile["owner"] | undefined {
  const lastPart = parts[parts.length - 1]
  if (parts.length < 5 || parts[0] !== SUBSYSTEM_DIR || lastPart !== PROPERTIES_FILE) return undefined
  if ((parts.length - 3) % 2 !== 0) return undefined

  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== CHILD_SUBSYSTEMS_DIR || !parts[index + 1]) return undefined
  }

  return createOwner(SUBSYSTEM_DIR, parts[parts.length - 2])
}

function matchFormPath(
  parts: string[],
): { owner: ValidationProjectFile["owner"]; formName: string } | undefined {
  if (parts.length !== 5 || parts[2] !== "Формы" || parts[4] !== FORM_FILE) return undefined

  const owner = createOwner(parts[0], parts[1])
  const formName = parts[3]
  if (!owner || !formName) return undefined

  return { owner, formName }
}

function createOwner(dir: string | undefined, name: string | undefined): ValidationProjectFile["owner"] | undefined {
  if (!dir || !name) return undefined

  const spec = getValidationProjectSpecByDir(dir)
  if (!spec) return undefined

  return { dir, name, spec }
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
