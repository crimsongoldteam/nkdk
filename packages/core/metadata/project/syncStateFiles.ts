import fs from "fs"
import { join } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import { DynamicListRules } from "~/metadata/forms/commonObjects/dynamicList/rules"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { describeMetadataRuleResources } from "./ruleResources"
import { configurationMetadataProjectSpec, metadataProjectSpecs, type MetadataProjectSpec } from "./specs"

const PROPERTIES_YAML = "Свойства.yaml"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"
const SUBSYSTEM_DIR = "Подсистема"

interface SyncStatePathMatcherSet {
  exactFiles: Set<string>
  regexes: RegExp[]
}

export async function collectSyncStateFilePaths(projectDir: string): Promise<string[]> {
  const matchers = compileSyncStatePathMatchers()
  const result: string[] = []

  await collectProjectFiles(result, projectDir, "", matchers)

  return result.sort((left, right) => left.localeCompare(right, "ru"))
}

async function collectProjectFiles(
  result: string[],
  projectDir: string,
  relativeDir: string,
  matchers: SyncStatePathMatcherSet,
): Promise<void> {
  const absDir = relativeDir === "" ? projectDir : join(projectDir, ...relativeDir.split("/"))
  if (!(await isDirectory(absDir))) return

  for (const entry of await fs.promises.readdir(absDir, { withFileTypes: true })) {
    if (shouldSkipProjectEntry(relativeDir, entry.name)) continue

    const projectPath = joinProjectPath(relativeDir, entry.name)
    if (entry.isDirectory()) {
      await collectProjectFiles(result, projectDir, projectPath, matchers)
    } else if (entry.isFile() && matchesSyncStatePath(projectPath, matchers)) {
      result.push(projectPath)
    }
  }
}

function shouldSkipProjectEntry(relativeDir: string, name: string): boolean {
  if (name === ".DS_Store") return true
  if (relativeDir === "" && (name === ".git" || name === ".nkdk-sync.yaml")) return true
  if (relativeDir === "" && name === "Миграции") return true
  return false
}

function matchesSyncStatePath(projectPath: string, matchers: SyncStatePathMatcherSet): boolean {
  if (matchers.exactFiles.has(projectPath)) return true
  return matchers.regexes.some((regex) => regex.test(projectPath))
}

function compileSyncStatePathMatchers(): SyncStatePathMatcherSet {
  const matchers: SyncStatePathMatcherSet = { exactFiles: new Set(), regexes: [] }

  addExactFileMatcher(matchers, CONFIGURATION_YAML_FILE)
  collectRulePathMatchers(matchers, configurationMetadataProjectSpec.rule, "")

  for (const spec of metadataProjectSpecs) {
    collectTopLevelSpecMatchers(matchers, spec)
  }

  return matchers
}

function collectTopLevelSpecMatchers(matchers: SyncStatePathMatcherSet, spec: MetadataProjectSpec): void {
  const rootPattern = `${escapeRegexSegment(spec.dir)}/[^/]+`
  addRegexMatcher(matchers, `^${rootPattern}/${escapeRegexSegment(PROPERTIES_YAML)}$`)
  collectRulePathMatchers(matchers, spec.rule, rootPattern)

  if (spec.dir === SUBSYSTEM_DIR) {
    const nestedSubsystemPattern = `${rootPattern}(?:/${escapeRegexSegment(CHILD_SUBSYSTEMS_DIR)}/[^/]+)*`
    addRegexMatcher(matchers, `^${nestedSubsystemPattern}/${escapeRegexSegment(PROPERTIES_YAML)}$`)
    collectRulePathMatchers(matchers, spec.rule, nestedSubsystemPattern)
  }
}

function collectRulePathMatchers(matchers: SyncStatePathMatcherSet, rule: MetadataItemRule, basePattern: string): void {
  for (const resource of describeMetadataRuleResources(rule)) {
    if (resource.kind === "asset") {
      addDirectoryMatcher(matchers, basePattern, resource.nkdkDir)
    }
  }

  for (const propertyRule of Object.values(rule.properties) as PropertyRule[]) {
    const syncArea = propertyRule.syncArea
    if (syncArea?.kind === "objectModule") addPathValueMatcher(matchers, basePattern, syncArea.yamlFile, { family: false })

    if ("nkdkDir" in propertyRule) addPathValueMatcher(matchers, basePattern, propertyRule.nkdkDir, { directory: true })
    if ("nkdkPath" in propertyRule) addPathValueMatcher(matchers, basePattern, propertyRule.nkdkPath, { family: true })

    const folderName = getReferenceOnlyFolderName(propertyRule)
    if (folderName !== undefined) addDirectoryMatcher(matchers, basePattern, folderName)

    if (propertyRule.type === "Template" && "nkdkPath" in propertyRule) {
      const nkdkPath = resolveStaticProjectPathValue(propertyRule.nkdkPath)
      if (nkdkPath !== undefined && !nkdkPath.includes("/")) addDirectoryMatcher(matchers, basePattern, "")
    }

    if (propertyRule.type === "ClientApplicationForm") {
      addPathValueMatcher(matchers, basePattern, "Form.xml", { family: true })
    }

    for (const resourceDir of getSyncExternalResourceDirs(propertyRule)) {
      addDirectoryMatcher(matchers, basePattern, resourceDir)
    }
  }

  for (const childCollection of rule.childCollections ?? []) {
    const childBasePattern =
      childCollection.nkdkDir === undefined
        ? basePattern
        : joinRegexPath(basePattern, pathValueToRegex(childCollection.nkdkDir))

    if (childCollection.nkdkDir !== undefined) {
      addRegexMatcher(matchers, `^${childBasePattern}/${escapeRegexSegment(PROPERTIES_YAML)}$`)
    }
    collectRulePathMatchers(matchers, childCollection.itemRule, childBasePattern)
  }
}

function addExactFileMatcher(matchers: SyncStatePathMatcherSet, projectPath: string): void {
  if (projectPath !== "") matchers.exactFiles.add(projectPath)
}

function addRegexMatcher(matchers: SyncStatePathMatcherSet, source: string): void {
  matchers.regexes.push(new RegExp(source))
}

function addDirectoryMatcher(matchers: SyncStatePathMatcherSet, basePattern: string, directoryPath: string): void {
  const dirPattern = joinRegexPath(basePattern, staticPathToRegex(directoryPath))
  if (dirPattern !== "") addRegexMatcher(matchers, `^${dirPattern}/.+$`)
}

function addPathValueMatcher(
  matchers: SyncStatePathMatcherSet,
  basePattern: string,
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
  options: { directory?: true; family?: boolean },
): void {
  const pathPattern = pathValueToRegex(value)
  if (pathPattern === undefined) return

  if (options.directory === true) {
    addRegexMatcher(matchers, `^${joinRegexPath(basePattern, pathPattern)}/.+$`)
    return
  }

  const fullPattern = joinRegexPath(basePattern, pathPattern)
  addRegexMatcher(matchers, `^${fullPattern}$`)

  if (options.family === true && typeof value === "string") {
    const familyPattern = pathFamilyRegex(pathPattern)
    if (familyPattern !== undefined) addRegexMatcher(matchers, `^${joinRegexPath(basePattern, familyPattern)}$`)
  }
}

function pathValueToRegex(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
): string | undefined {
  if (typeof value === "string") return staticPathToRegex(value)
  if (typeof value !== "function") return undefined

  const sample = value({ name: "__NKDK_NAME__", parentName: "__NKDK_PARENT__" })
  return staticPathToRegex(sample)
    .split("__NKDK_NAME__")
    .join("[^/]+")
    .split("__NKDK_PARENT__")
    .join("[^/]+")
}

function resolveStaticProjectPathValue(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined
}

function staticPathToRegex(projectPath: string): string {
  if (projectPath === "") return ""
  return projectPath.split("/").map(escapeRegexSegment).join("/")
}

function pathFamilyRegex(pathPattern: string): string | undefined {
  const slashIndex = pathPattern.lastIndexOf("/")
  const dirPattern = slashIndex === -1 ? "" : pathPattern.slice(0, slashIndex)
  const filePattern = slashIndex === -1 ? pathPattern : pathPattern.slice(slashIndex + 1)
  const dotIndex = filePattern.lastIndexOf("\\.")
  if (dotIndex <= 0) return undefined

  const stemPattern = filePattern.slice(0, dotIndex)
  return joinRegexPath(dirPattern, `${stemPattern}\\.[^/]+`)
}

function joinRegexPath(basePattern: string, childPattern: string | undefined): string {
  if (childPattern === undefined || childPattern === "") return basePattern
  if (basePattern === "") return childPattern
  return `${basePattern}/${childPattern}`
}

function escapeRegexSegment(segment: string): string {
  return segment.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
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

function isNotFoundError(caught: unknown): boolean {
  return typeof caught === "object" && caught !== null && "code" in caught && caught.code === "ENOENT"
}
