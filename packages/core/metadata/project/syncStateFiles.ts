import fs from "fs"
import { join } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { describeMetadataRuleResources } from "./ruleResources"
import { configurationMetadataProjectSpec, metadataProjectSpecs, type MetadataProjectSpec } from "./specs"

const PROPERTIES_YAML = "Свойства.yaml"
const FORMS_DIR = "Формы"
const FORM_YAML = "Форма.yaml"
const FORM_MODULE = "Модуль.bsl"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"
const SUBSYSTEM_DIR = "Подсистема"

export async function collectSyncStateFilePaths(projectDir: string): Promise<string[]> {
  const result = new Set<string>()

  await addFileIfExists(result, projectDir, CONFIGURATION_YAML_FILE)
  await collectDeclaredRuleResources(result, projectDir, configurationMetadataProjectSpec, "", "")

  for (const spec of metadataProjectSpecs) {
    await collectSpecFiles(result, projectDir, spec)
  }

  return [...result].sort((left, right) => left.localeCompare(right, "ru"))
}

async function collectSpecFiles(result: Set<string>, projectDir: string, spec: MetadataProjectSpec): Promise<void> {
  const kindDir = join(projectDir, spec.dir)
  if (!(await isDirectory(kindDir))) return

  for (const entry of await fs.promises.readdir(kindDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    await collectObjectFiles(result, projectDir, spec, `${spec.dir}/${entry.name}`, entry.name)
  }
}

async function collectObjectFiles(
  result: Set<string>,
  projectDir: string,
  spec: MetadataProjectSpec,
  objectPath: string,
  objectName: string,
): Promise<void> {
  await addFileIfExists(result, projectDir, `${objectPath}/${PROPERTIES_YAML}`)
  await collectForms(result, projectDir, objectPath)
  await collectDeclaredRuleResources(result, projectDir, spec, objectPath, objectName)

  if (objectPath.startsWith(`${SUBSYSTEM_DIR}/`)) {
    await collectNestedSubsystems(result, projectDir, objectPath)
  }
}

async function collectForms(result: Set<string>, projectDir: string, objectPath: string): Promise<void> {
  const formsDir = join(projectDir, ...objectPath.split("/"), FORMS_DIR)
  if (!(await isDirectory(formsDir))) return

  for (const entry of await fs.promises.readdir(formsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const formPath = `${objectPath}/${FORMS_DIR}/${entry.name}`
    await addFileIfExists(result, projectDir, `${formPath}/${FORM_YAML}`)
    await addFileIfExists(result, projectDir, `${formPath}/${FORM_MODULE}`)
  }
}

async function collectDeclaredRuleResources(
  result: Set<string>,
  projectDir: string,
  spec: MetadataProjectSpec,
  objectPath: string,
  objectName: string,
): Promise<void> {
  for (const resource of describeMetadataRuleResources(spec.rule)) {
    if (resource.kind === "asset") {
      await collectDirectoryFiles(result, projectDir, joinProjectPath(objectPath, resource.nkdkDir))
    }
  }

  for (const propertyRule of Object.values(spec.rule.properties) as PropertyRule[]) {
    const syncArea = propertyRule.syncArea
    if (syncArea?.kind === "objectModule") {
      await addFileIfExists(result, projectDir, joinProjectPath(objectPath, syncArea.yamlFile))
    }

    if ("nkdkDir" in propertyRule) {
      const nkdkDir = resolveProjectPathValue(propertyRule.nkdkDir, objectName)
      if (nkdkDir !== undefined) await collectDirectoryFiles(result, projectDir, joinProjectPath(objectPath, nkdkDir))
    }

    if ("nkdkPath" in propertyRule) {
      const nkdkPath = resolveProjectPathValue(propertyRule.nkdkPath, objectName)
      if (nkdkPath !== undefined) await addFileIfExists(result, projectDir, joinProjectPath(objectPath, nkdkPath))
    }
  }
}

async function collectDirectoryFiles(result: Set<string>, projectDir: string, projectPath: string): Promise<void> {
  if (projectPath === "") return

  const absPath = join(projectDir, ...projectPath.split("/"))
  if (!(await isDirectory(absPath))) return

  for (const entry of await fs.promises.readdir(absPath, { withFileTypes: true })) {
    const childPath = `${projectPath}/${entry.name}`
    if (entry.isDirectory()) {
      await collectDirectoryFiles(result, projectDir, childPath)
    } else if (entry.isFile()) {
      result.add(childPath)
    }
  }
}

async function collectNestedSubsystems(result: Set<string>, projectDir: string, objectPath: string): Promise<void> {
  const childRoot = `${objectPath}/${CHILD_SUBSYSTEMS_DIR}`
  const childRootAbs = join(projectDir, ...childRoot.split("/"))
  if (!(await isDirectory(childRootAbs))) return

  for (const entry of await fs.promises.readdir(childRootAbs, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const childPath = `${childRoot}/${entry.name}`
    await addFileIfExists(result, projectDir, `${childPath}/${PROPERTIES_YAML}`)
    await collectNestedSubsystems(result, projectDir, childPath)
  }
}

async function addFileIfExists(result: Set<string>, projectDir: string, projectPath: string): Promise<void> {
  if (projectPath !== "" && (await isFile(join(projectDir, ...projectPath.split("/"))))) result.add(projectPath)
}

function resolveProjectPathValue(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
  name: string,
): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "function") return value({ name })
  return undefined
}

function joinProjectPath(basePath: string, childPath: string): string {
  if (basePath === "") return childPath
  if (childPath === "") return basePath
  return `${basePath}/${childPath}`
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await fs.promises.stat(path)).isDirectory()
  } catch (caught) {
    if (isNotFoundError(caught)) return false
    throw caught
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await fs.promises.stat(path)).isFile()
  } catch (caught) {
    if (isNotFoundError(caught)) return false
    throw caught
  }
}

function isNotFoundError(caught: unknown): boolean {
  return typeof caught === "object" && caught !== null && "code" in caught && caught.code === "ENOENT"
}
