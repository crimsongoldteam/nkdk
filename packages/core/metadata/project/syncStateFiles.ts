import fs from "fs"
import { join } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import { DynamicListRules } from "~/metadata/forms/commonObjects/dynamicList/rules"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
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
  await collectDeclaredRuleResources(result, projectDir, configurationMetadataProjectSpec.rule, "", "")

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
  await collectDeclaredRuleResources(result, projectDir, spec.rule, objectPath, objectName)
  await collectRuleDeclaredChildFiles(result, projectDir, spec.rule, objectPath, objectName)

  if (objectPath.startsWith(`${SUBSYSTEM_DIR}/`)) {
    await collectNestedSubsystems(result, projectDir, spec.rule, objectPath)
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
  rule: MetadataItemRule,
  objectPath: string,
  objectName: string,
): Promise<void> {
  for (const resource of describeMetadataRuleResources(rule)) {
    if (resource.kind === "asset") {
      await collectDirectoryFiles(result, projectDir, joinProjectPath(objectPath, resource.nkdkDir))
    }
  }

  for (const propertyRule of Object.values(rule.properties) as PropertyRule[]) {
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
      if (nkdkPath !== undefined) await addFileFamilyIfExists(result, projectDir, joinProjectPath(objectPath, nkdkPath))
    }

    if (propertyRule.type === "Template" && "nkdkPath" in propertyRule) {
      const nkdkPath = resolveProjectPathValue(propertyRule.nkdkPath, objectName)
      if (nkdkPath !== undefined && !nkdkPath.includes("/")) {
        await collectDirectoryFiles(result, projectDir, objectPath, { exclude: new Set([PROPERTIES_YAML]) })
      }
    }

    if (propertyRule.type === "ClientApplicationForm") {
      await addFileFamilyIfExists(result, projectDir, joinProjectPath(objectPath, "Form.xml"))
    }

    for (const resourceDir of getSyncExternalResourceDirs(propertyRule)) {
      await collectDirectoryFiles(result, projectDir, joinProjectPath(objectPath, resourceDir))
    }
  }
}

async function collectRuleDeclaredChildFiles(
  result: Set<string>,
  projectDir: string,
  rule: MetadataItemRule,
  objectPath: string,
  objectName: string,
): Promise<void> {
  for (const propertyRule of Object.values(rule.properties) as PropertyRule[]) {
    const folderName = getReferenceOnlyFolderName(propertyRule)
    if (folderName !== undefined) await collectDirectoryFiles(result, projectDir, joinProjectPath(objectPath, folderName))
  }

  const objectYaml = await readObjectYaml(projectDir, objectPath)
  if (objectYaml === undefined) return

  for (const childCollection of rule.childCollections ?? []) {
    const propertyRule = rule.properties[childCollection.propertyKey]
    const yamlKey = propertyRule?.yaml
    if (typeof yamlKey !== "string") continue

    for (const childName of readYamlCollectionNames(objectYaml, yamlKey)) {
      const childBasePath =
        childCollection.nkdkDir === undefined
          ? objectPath
          : joinProjectPath(objectPath, resolveProjectPathValue(childCollection.nkdkDir, childName, objectName) ?? "")

      if (childCollection.nkdkDir !== undefined) {
        await addFileIfExists(result, projectDir, joinProjectPath(childBasePath, PROPERTIES_YAML))
      }
      await collectDeclaredRuleResources(result, projectDir, childCollection.itemRule, childBasePath, childName)
      await collectRuleDeclaredChildFiles(result, projectDir, childCollection.itemRule, childBasePath, childName)
    }
  }
}

async function readObjectYaml(projectDir: string, objectPath: string): Promise<unknown | undefined> {
  const yamlPath = joinProjectPath(objectPath, PROPERTIES_YAML)
  const absPath = join(projectDir, ...yamlPath.split("/"))
  if (!(await isFile(absPath))) return undefined

  const text = await fs.promises.readFile(absPath, "utf-8")
  return parseMetadataYaml(text).data
}

function readYamlCollectionNames(yaml: unknown, yamlKey: string): string[] {
  if (!isRecord(yaml)) return []

  const collection = yaml[yamlKey]
  if (Array.isArray(collection)) {
    return collection.flatMap((item) => {
      if (typeof item === "string") return [item]
      return isRecord(item) && typeof item["Имя"] === "string" ? [item["Имя"]] : []
    })
  }

  if (isRecord(collection)) return Object.keys(collection)
  return []
}

function getReferenceOnlyFolderName(rule: PropertyRule): string | undefined {
  const folderName = (rule as { folderName?: unknown }).folderName
  return rule.forReferenceOnly === true && typeof folderName === "string" ? folderName : undefined
}

function getSyncExternalResourceDirs(rule: PropertyRule): string[] {
  const result = new Set<string>()

  if (rule.syncExternalOnly === true && typeof rule.yaml === "string") result.add(rule.yaml)
  if (rule.type === "WSDefinitionSchemas") result.add("XSD")
  if (rule.type === "ClientApplicationForm") {
    collectResourceDirsFromRule(result, ClientApplicationFormRules)
    collectResourceDirsFromRule(result, DynamicListRules)
  }

  return [...result]
}

function collectResourceDirsFromRule(result: Set<string>, rule: MetadataItemRule): void {
  for (const resource of describeMetadataRuleResources(rule)) {
    if (resource.kind === "asset") result.add(resource.nkdkDir)
  }

  for (const propertyRule of Object.values(rule.properties) as PropertyRule[]) {
    if (propertyRule.syncExternalOnly === true && typeof propertyRule.yaml === "string") result.add(propertyRule.yaml)
  }
}

async function collectDirectoryFiles(
  result: Set<string>,
  projectDir: string,
  projectPath: string,
  options: { exclude?: ReadonlySet<string> } = {},
): Promise<void> {
  if (projectPath === "") return

  const absPath = join(projectDir, ...projectPath.split("/"))
  if (!(await isDirectory(absPath))) return

  for (const entry of await fs.promises.readdir(absPath, { withFileTypes: true })) {
    if (options.exclude?.has(entry.name)) continue
    const childPath = `${projectPath}/${entry.name}`
    if (entry.isDirectory()) {
      await collectDirectoryFiles(result, projectDir, childPath, options)
    } else if (entry.isFile()) {
      result.add(childPath)
    }
  }
}

async function collectNestedSubsystems(
  result: Set<string>,
  projectDir: string,
  rule: MetadataItemRule,
  objectPath: string,
): Promise<void> {
  const childRoot = `${objectPath}/${CHILD_SUBSYSTEMS_DIR}`
  const childRootAbs = join(projectDir, ...childRoot.split("/"))
  if (!(await isDirectory(childRootAbs))) return

  for (const entry of await fs.promises.readdir(childRootAbs, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const childPath = `${childRoot}/${entry.name}`
    await addFileIfExists(result, projectDir, `${childPath}/${PROPERTIES_YAML}`)
    await collectDeclaredRuleResources(result, projectDir, rule, childPath, entry.name)
    await collectRuleDeclaredChildFiles(result, projectDir, rule, childPath, entry.name)
    await collectNestedSubsystems(result, projectDir, rule, childPath)
  }
}

async function addFileIfExists(result: Set<string>, projectDir: string, projectPath: string): Promise<void> {
  if (projectPath !== "" && (await isFile(join(projectDir, ...projectPath.split("/"))))) result.add(projectPath)
}

async function addFileFamilyIfExists(result: Set<string>, projectDir: string, projectPath: string): Promise<void> {
  await addFileIfExists(result, projectDir, projectPath)

  const slashIndex = projectPath.lastIndexOf("/")
  const dirPath = slashIndex === -1 ? "" : projectPath.slice(0, slashIndex)
  const fileName = slashIndex === -1 ? projectPath : projectPath.slice(slashIndex + 1)
  const dotIndex = fileName.lastIndexOf(".")
  if (dotIndex <= 0) return

  const stem = fileName.slice(0, dotIndex)
  const absDir = dirPath === "" ? projectDir : join(projectDir, ...dirPath.split("/"))
  if (!(await isDirectory(absDir))) return

  for (const entry of await fs.promises.readdir(absDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.startsWith(`${stem}.`)) result.add(joinProjectPath(dirPath, entry.name))
  }
}

function resolveProjectPathValue(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
  name: string,
  parentName?: string,
): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "function") return value({ name, parentName })
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
