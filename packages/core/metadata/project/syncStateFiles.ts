import fs from "fs"
import { join } from "path"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { CONFIGURATION_YAML_FILE } from "./constants"
import { describeMetadataRuleProjectResources } from "./ruleResources"
import { configurationMetadataProjectSpec, metadataProjectSpecs, type MetadataProjectSpec } from "./specs"

const PROPERTIES_YAML = "Свойства.yaml"

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
  matchers: SyncStatePathMatcherSet
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

  if (spec.nesting?.kind === "recursiveChildDir") {
    const nestedPattern = `${rootPattern}(?:/${escapeRegexSegment(spec.nesting.childDir)}/[^/]+)*`
    addRegexMatcher(matchers, `^${nestedPattern}/${escapeRegexSegment(PROPERTIES_YAML)}$`)
    collectRulePathMatchers(matchers, spec.rule, nestedPattern)
  }
}

function collectRulePathMatchers(matchers: SyncStatePathMatcherSet, rule: MetadataItemRule, basePattern: string): void {
  for (const resource of describeMetadataRuleProjectResources(rule)) {
    if (resource.kind === "yaml") {
      addProjectPatternMatcher(matchers, basePattern, resource.projectPattern, {
        family: resource.role === "resourceOnly",
      })
    } else {
      addProjectDirectoryMatcher(matchers, basePattern, resource.projectPattern)
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

function addProjectPatternMatcher(
  matchers: SyncStatePathMatcherSet,
  basePattern: string,
  projectPattern: string,
  options: { family?: boolean } = {}
): void {
  const fullPattern = joinRegexPath(basePattern, projectPatternToRegex(projectPattern))
  addRegexMatcher(matchers, `^${fullPattern}$`)

  if (options.family === true && !projectPattern.includes("{")) {
    const familyPattern = pathFamilyRegex(fullPattern)
    if (familyPattern !== undefined) addRegexMatcher(matchers, `^${familyPattern}$`)
  }
}

function addProjectDirectoryMatcher(
  matchers: SyncStatePathMatcherSet,
  basePattern: string,
  projectPattern: string
): void {
  const fullPattern = joinRegexPath(basePattern, projectPatternToRegex(projectPattern))
  if (fullPattern !== "") addRegexMatcher(matchers, `^${fullPattern}/.+$`)
}

function pathValueToRegex(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined
): string | undefined {
  if (typeof value === "string") return staticPathToRegex(value)
  if (typeof value !== "function") return undefined

  const sample = value({ name: "__NKDK_NAME__", parentName: "__NKDK_PARENT__" })
  return staticPathToRegex(sample).split("__NKDK_NAME__").join("[^/]+").split("__NKDK_PARENT__").join("[^/]+")
}

function staticPathToRegex(projectPath: string): string {
  if (projectPath === "") return ""
  return projectPath.split("/").map(escapeRegexSegment).join("/")
}

function projectPatternToRegex(projectPattern: string): string {
  if (projectPattern === "") return ""
  return projectPattern.split("/").map(projectPatternSegmentToRegex).join("/")
}

function projectPatternSegmentToRegex(segment: string): string {
  return segment
    .split(/(\{[^}]+\})/g)
    .map((part) => (/^\{[^}]+\}$/.test(part) ? "[^/]+" : escapeRegexSegment(part)))
    .join("")
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
