import { readdir } from "fs/promises"
import { join, resolve } from "path"
import { expandMetadataPathPattern } from "./patterns"
import type {
  CompiledMetadataAssignmentNode,
  CompiledMetadataExternalFileNode,
  CompiledMetadataIgnoredPathNode,
  CompiledMetadataPathCursor,
  CompiledMetadataPathMatch,
  CompiledMetadataResourceTopology,
  CompiledMetadataYamlCompanionNode,
  MetadataResourceRole,
  MetadataResourceItemRule,
  TopologyMetadataTargetOwnerFrame,
  TopologyMetadataTargetOwnerResolver,
} from "./types"

export interface MetadataProjectResourceOwner {
  readonly assignmentNodeId: string
  readonly projectPattern: string
  readonly itemRule: MetadataResourceItemRule
}

export interface MetadataProjectResourceMatch {
  readonly kind: "content" | "yamlCompanion" | "externalFile" | "ignore"
  readonly projectPath: string
  readonly assignment: CompiledMetadataAssignmentNode | undefined
  readonly externalFile?: CompiledMetadataExternalFileNode
  readonly yamlCompanion?: CompiledMetadataYamlCompanionNode
  readonly ignoredPath?: CompiledMetadataIgnoredPathNode
  readonly values: Readonly<Record<string, string>>
  readonly role: MetadataResourceRole
  readonly rule: MetadataResourceItemRule | undefined
  readonly owner: MetadataProjectResourceOwner | undefined
  readonly compositionImpact: "none" | "configurationComposition"
}

export interface MetadataProjectPathCandidate {
  readonly absolutePath: string
  readonly projectPath: string
  classify(): MetadataProjectResourceMatch | undefined
}

export interface MetadataFileBackedTargetContribution {
  readonly kind: "member"
  readonly memberKind: "Form" | "Template"
  readonly owner: { readonly root: string; readonly objectName: string }
  readonly itemName: string
  readonly evidenceProjectPath: string
  readonly itemProjectPath: string
  readonly ownerProjectPath: string
}

export function projectMetadataFileBackedTargets(
  topology: CompiledMetadataResourceTopology,
  match: MetadataProjectResourceMatch,
  resolveMetadataTargetOwner: TopologyMetadataTargetOwnerResolver,
): readonly MetadataFileBackedTargetContribution[] {
  const declaration = match.kind === "content"
    ? match.assignment?.fileBackedTarget
    : match.kind === "externalFile"
      ? match.externalFile?.fileBackedTarget
      : undefined
  if (declaration === undefined) return []

  const itemName = match.values[declaration.itemNameParameter]
  const owner = resolveFileBackedTargetOwner(
    topology,
    declaration.ownerAssignmentNodeId,
    match.values,
    resolveMetadataTargetOwner,
  )
  if (itemName === undefined || owner === undefined) {
    throw new Error(`Не удалось спроецировать файловую цель из ${match.projectPath}`)
  }
  return [{
    kind: "member",
    memberKind: declaration.memberKind,
    owner,
    itemName,
    evidenceProjectPath: match.projectPath,
    itemProjectPath: expandMetadataPathPattern(declaration.itemProjectPattern, match.values),
    ownerProjectPath: expandMetadataPathPattern(declaration.ownerProjectPattern, match.values),
  }]
}

function resolveFileBackedTargetOwner(
  topology: CompiledMetadataResourceTopology,
  ownerAssignmentNodeId: string,
  values: Readonly<Record<string, string>>,
  resolveMetadataTargetOwner: TopologyMetadataTargetOwnerResolver,
): { readonly root: string; readonly objectName: string } | undefined {
  const assignmentsById = new Map(topology.assignments.map((assignment) => [assignment.id, assignment]))
  const assignmentsByPattern = new Map(topology.assignments.map((assignment) => [assignment.projectPattern, assignment]))
  const chain: CompiledMetadataAssignmentNode[] = []
  let assignment = assignmentsById.get(ownerAssignmentNodeId)
  while (assignment !== undefined) {
    chain.push(assignment)
    assignment = assignment.ownerProjectPattern === undefined
      ? undefined
      : assignmentsByPattern.get(assignment.ownerProjectPattern)
  }

  const frames: TopologyMetadataTargetOwnerFrame[] = []
  for (const current of chain.reverse()) {
    const nameParameter = patternParameters(current.projectPattern).at(-1)
    const name = nameParameter === undefined ? undefined : values[nameParameter]
    if (name === undefined) return undefined
    const owner = resolveMetadataTargetOwner({
      itemRule: current.itemRule,
      name,
      frames,
    })
    frames.push({
      itemType: current.itemRule.itemType,
      name,
      ...(owner === undefined ? {} : { owner }),
    })
  }
  return frames.at(-1)?.owner
}

function patternParameters(pattern: string): string[] {
  return [...pattern.matchAll(/\{([^}]+?)(?:\.\.\.)?\}/g)].map((match) => match[1]!)
}

export function classifyMetadataProjectPath(
  topology: CompiledMetadataResourceTopology,
  projectPath: string
): MetadataProjectResourceMatch | undefined {
  return createMetadataProjectPathClassifier(topology)(projectPath)
}

export function createMetadataProjectPathClassifier(
  topology: CompiledMetadataResourceTopology,
): (projectPath: string) => MetadataProjectResourceMatch | undefined {
  const resolveMatches = createMetadataProjectMatchResolver(topology)
  return (projectPath) => {
    const normalized = normalizeProjectPath(projectPath)
    if (normalized === undefined) return undefined
    return resolveMatches(normalized, topology.projectIndex.match(normalized))
  }
}

function createMetadataProjectMatchResolver(
  topology: CompiledMetadataResourceTopology,
): (projectPath: string, matches: readonly CompiledMetadataPathMatch[]) => MetadataProjectResourceMatch | undefined {
  const assignmentsById = new Map(topology.assignments.map((assignment) => [assignment.id, assignment]))
  const assignmentsByProjectPattern = new Map<string, CompiledMetadataAssignmentNode>()
  for (const assignment of topology.assignments) {
    if (!assignmentsByProjectPattern.has(assignment.projectPattern)) {
      assignmentsByProjectPattern.set(assignment.projectPattern, assignment)
    }
  }
  const externalById = new Map(
    topology.assignments.flatMap((assignment) =>
      assignment.externalFiles.map((externalFile) => [externalFile.id, { assignment, externalFile }] as const)
    )
  )
  const companionsById = new Map(
    topology.assignments.flatMap((assignment) =>
      assignment.yamlCompanions.map((yamlCompanion) => [yamlCompanion.id, { assignment, yamlCompanion }] as const)
    )
  )
  const ignoredById = new Map(
    topology.ignoredPaths.filter((path) => path.side === "project").map((path) => [path.id, path])
  )
  return (projectPath, matches) => classifyMetadataProjectPathWithMatches({
    projectPath,
    matches,
    assignmentsById,
    assignmentsByProjectPattern,
    externalById,
    companionsById,
    ignoredById,
  })
}

function classifyMetadataProjectPathWithMatches(params: {
  readonly projectPath: string
  readonly matches: readonly CompiledMetadataPathMatch[]
  readonly assignmentsById: ReadonlyMap<string, CompiledMetadataAssignmentNode>
  readonly assignmentsByProjectPattern: ReadonlyMap<string, CompiledMetadataAssignmentNode>
  readonly externalById: ReadonlyMap<string, {
    readonly assignment: CompiledMetadataAssignmentNode
    readonly externalFile: CompiledMetadataExternalFileNode
  }>
  readonly companionsById: ReadonlyMap<string, {
    readonly assignment: CompiledMetadataAssignmentNode
    readonly yamlCompanion: CompiledMetadataYamlCompanionNode
  }>
  readonly ignoredById: ReadonlyMap<string, CompiledMetadataIgnoredPathNode>
}): MetadataProjectResourceMatch | undefined {
  const {
    projectPath,
    matches,
    assignmentsById,
    assignmentsByProjectPattern,
    externalById,
    companionsById,
    ignoredById,
  } = params
  const candidates = matches.flatMap((match): MetadataProjectResourceMatch[] => {
    const assignment = assignmentsById.get(match.nodeId)
    if (assignment !== undefined) {
      return [{
        kind: "content",
        projectPath,
        assignment,
        values: match.values,
        role: assignment.role,
        rule: assignment.itemRule,
        owner: resolveOwner(assignmentsByProjectPattern, assignment),
        compositionImpact: assignment.compositionImpact,
      }]
    }
    const external = externalById.get(match.nodeId)
    if (external !== undefined) {
      return [{
        kind: "externalFile",
        projectPath,
        assignment: external.assignment,
        externalFile: external.externalFile,
        values: match.values,
        role: "external",
        rule: undefined,
        owner: resolveOwner(assignmentsByProjectPattern, external.assignment),
        compositionImpact: external.externalFile.compositionImpact,
      }]
    }
    const companion = companionsById.get(match.nodeId)
    if (companion !== undefined) {
      return [{
        kind: "yamlCompanion",
        projectPath,
        assignment: companion.assignment,
        yamlCompanion: companion.yamlCompanion,
        values: match.values,
        role: companion.yamlCompanion.projectRole,
        rule: companion.yamlCompanion.itemRule,
        owner: resolveOwner(assignmentsByProjectPattern, companion.assignment),
        compositionImpact: "none",
      }]
    }
    const ignoredPath = ignoredById.get(match.nodeId)
    return ignoredPath === undefined
      ? []
      : [{
          kind: "ignore",
          projectPath,
          assignment: undefined,
          ignoredPath,
          values: match.values,
          role: "external",
          rule: undefined,
          owner: undefined,
          compositionImpact: "none",
        }]
  })
  const preferred = candidates.some((candidate) => candidate.externalFile?.fallback !== true)
    ? candidates.filter((candidate) => candidate.externalFile?.fallback !== true)
    : candidates
  if (preferred.length > 1) {
    throw new Error(`Путь Проекта принадлежит нескольким ресурсам: ${projectPath}`)
  }
  return preferred[0]
}

export async function discoverMetadataProjectResources(params: {
  readonly topology: CompiledMetadataResourceTopology
  readonly projectDir: string
  readonly include?: "all" | "content"
  readonly sort?: boolean
}): Promise<readonly MetadataProjectResourceMatch[]> {
  const matches: MetadataProjectResourceMatch[] = []
  for await (const match of iterateMetadataProjectResources(params)) matches.push(match)
  return params.sort === false
    ? matches
    : matches.sort((left, right) => Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath)))
}

export async function* iterateMetadataProjectResources(params: {
  readonly topology: CompiledMetadataResourceTopology
  readonly projectDir: string
  readonly include?: "all" | "content"
}): AsyncGenerator<MetadataProjectResourceMatch> {
  for await (const candidate of iterateMetadataProjectPathCandidates(params)) {
    const match = candidate.classify()
    if (match === undefined || match.kind === "ignore") continue
    yield match
  }
}

export async function* iterateMetadataProjectPathCandidates(params: {
  readonly topology: CompiledMetadataResourceTopology
  readonly projectDir: string
  readonly include?: "all" | "content"
  readonly readDirectory?: ReadProjectDirectory
}): AsyncGenerator<MetadataProjectPathCandidate> {
  const root = resolve(params.projectDir)
  const readDirectory = params.readDirectory ?? defaultReadProjectDirectory
  const resolveMatches = createMetadataProjectMatchResolver(params.topology)
  let directories: ProjectDirectoryTask[] = [{
    absolutePath: root,
    projectSegments: [],
    cursor: params.topology.projectIndex.root(),
  }]
  while (directories.length > 0) {
    const nextDirectories: ProjectDirectoryTask[] = []
    for (let offset = 0; offset < directories.length; offset += PROJECT_DISCOVERY_CONCURRENCY) {
      const batch = directories.slice(offset, offset + PROJECT_DISCOVERY_CONCURRENCY)
      const entriesByDirectory = await Promise.all(batch.map(async (task) => ({
        task,
        entries: await readDirectory(task.absolutePath),
      })))
      for (const { task, entries } of entriesByDirectory) {
        for (const entry of entries) {
          if (entry.isDirectory() && (entry.name === ".git" || entry.name === ".nkdk")) continue
          const cursor = task.cursor.advance(entry.name)
          if (cursor === undefined) continue
          const absolutePath = join(task.absolutePath, entry.name)
          const projectSegments = [...task.projectSegments, entry.name]
          if (entry.isDirectory()) {
            if (cursor.canDescend) nextDirectories.push({ absolutePath, projectSegments, cursor })
            continue
          }
          if (!entry.isFile() || cursor.matches().length === 0) continue
          const projectPath = projectSegments.join("/")
          yield {
            absolutePath,
            projectPath,
            classify() {
              const match = resolveMatches(projectPath, cursor.matches())
              return params.include === "content"
                && match?.kind !== "content"
                && match?.kind !== "yamlCompanion"
                ? undefined
                : match
            },
          }
        }
      }
    }
    directories = nextDirectories
  }
}

function resolveOwner(
  assignmentsByProjectPattern: ReadonlyMap<string, CompiledMetadataAssignmentNode>,
  assignment: CompiledMetadataAssignmentNode
): MetadataProjectResourceOwner | undefined {
  if (assignment.ownerProjectPattern === undefined) return undefined
  const owner = assignmentsByProjectPattern.get(assignment.ownerProjectPattern)
  return owner === undefined
    ? undefined
    : {
        assignmentNodeId: owner.id,
        projectPattern: owner.projectPattern,
        itemRule: owner.itemRule,
      }
}

export interface ProjectDirectoryEntry {
  readonly name: string
  isDirectory(): boolean
  isFile(): boolean
}

export type ReadProjectDirectory = (directory: string) => Promise<readonly ProjectDirectoryEntry[]>

interface ProjectDirectoryTask {
  readonly absolutePath: string
  readonly projectSegments: readonly string[]
  readonly cursor: CompiledMetadataPathCursor
}

const PROJECT_DISCOVERY_CONCURRENCY = 32

const defaultReadProjectDirectory: ReadProjectDirectory = (directory) => readdir(directory, { withFileTypes: true })

export async function listProjectFiles(
  root: string,
  readDirectory: ReadProjectDirectory = defaultReadProjectDirectory,
): Promise<string[]> {
  const files: string[] = []
  for await (const file of iterateProjectFiles(root, readDirectory)) files.push(file)
  return files
}

export async function* iterateProjectFiles(
  root: string,
  readDirectory: ReadProjectDirectory = defaultReadProjectDirectory,
): AsyncGenerator<string> {
  let directories = [root]
  while (directories.length > 0) {
    const nextDirectories: string[] = []
    for (let offset = 0; offset < directories.length; offset += PROJECT_DISCOVERY_CONCURRENCY) {
      const batch = directories.slice(offset, offset + PROJECT_DISCOVERY_CONCURRENCY)
      const entriesByDirectory = await Promise.all(batch.map(async (directory) => ({
        directory,
        entries: await readDirectory(directory),
      })))
      for (const { directory, entries } of entriesByDirectory) {
        for (const entry of entries) {
          if (entry.isDirectory() && (entry.name === ".git" || entry.name === ".nkdk")) continue
          const path = join(directory, entry.name)
          if (entry.isDirectory()) nextDirectories.push(path)
          else if (entry.isFile()) yield path
        }
      }
    }
    directories = nextDirectories
  }
}

function normalizeProjectPath(projectPath: string): string | undefined {
  const normalized = projectPath.replace(/\\/g, "/").replace(/^\.\//, "")
  return normalized.split("/").some((segment) => segment.length === 0) ? undefined : normalized
}
