import { readdir } from "fs/promises"
import { join, relative, resolve } from "path"
import type { MetadataItemRule } from "../orchestration/property/types"
import type {
  CompiledMetadataAssignmentNode,
  CompiledMetadataExternalFileNode,
  CompiledMetadataIgnoredPathNode,
  CompiledMetadataResourceTopology,
  MetadataResourceRole,
} from "./types"

export interface MetadataProjectResourceOwner {
  readonly assignmentNodeId: string
  readonly projectPattern: string
  readonly itemRule: MetadataItemRule
}

export interface MetadataProjectResourceMatch {
  readonly kind: "content" | "externalFile" | "ignore"
  readonly projectPath: string
  readonly assignment: CompiledMetadataAssignmentNode | undefined
  readonly externalFile?: CompiledMetadataExternalFileNode
  readonly ignoredPath?: CompiledMetadataIgnoredPathNode
  readonly values: Readonly<Record<string, string>>
  readonly role: MetadataResourceRole
  readonly rule: MetadataItemRule | undefined
  readonly owner: MetadataProjectResourceOwner | undefined
  readonly compositionImpact: "none" | "configurationComposition"
}

export function classifyMetadataProjectPath(
  topology: CompiledMetadataResourceTopology,
  projectPath: string
): MetadataProjectResourceMatch | undefined {
  const normalized = projectPath.replace(/\\/g, "/").replace(/^\.\//, "")
  if (normalized.split("/").some((segment) => segment.length === 0)) return undefined
  const assignmentsById = new Map(topology.assignments.map((assignment) => [assignment.id, assignment]))
  const externalById = new Map(
    topology.assignments.flatMap((assignment) =>
      assignment.externalFiles.map((externalFile) => [externalFile.id, { assignment, externalFile }] as const)
    )
  )
  const ignoredById = new Map(
    topology.ignoredPaths.filter((path) => path.side === "project").map((path) => [path.id, path])
  )
  const candidates = topology.projectIndex.match(normalized).flatMap((match): MetadataProjectResourceMatch[] => {
    const assignment = assignmentsById.get(match.nodeId)
    if (assignment !== undefined) {
      return [{
        kind: "content",
        projectPath: normalized,
        assignment,
        values: match.values,
        role: assignment.role,
        rule: assignment.itemRule,
        owner: resolveOwner(topology, assignment),
        compositionImpact: assignment.compositionImpact,
      }]
    }
    const external = externalById.get(match.nodeId)
    if (external !== undefined) {
      return [{
        kind: "externalFile",
        projectPath: normalized,
        assignment: external.assignment,
        externalFile: external.externalFile,
        values: match.values,
        role: "external",
        rule: undefined,
        owner: resolveOwner(topology, external.assignment),
        compositionImpact: external.externalFile.compositionImpact,
      }]
    }
    const ignoredPath = ignoredById.get(match.nodeId)
    return ignoredPath === undefined
      ? []
      : [{
          kind: "ignore",
          projectPath: normalized,
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
    throw new Error(`Путь Проекта принадлежит нескольким ресурсам: ${normalized}`)
  }
  return preferred[0]
}

export async function discoverMetadataProjectResources(params: {
  readonly topology: CompiledMetadataResourceTopology
  readonly projectDir: string
  readonly include?: "all" | "content"
}): Promise<readonly MetadataProjectResourceMatch[]> {
  const root = resolve(params.projectDir)
  const matches: MetadataProjectResourceMatch[] = []
  for (const absolutePath of await listFiles(root)) {
    const projectPath = relative(root, absolutePath).replace(/\\/g, "/")
    const match = classifyMetadataProjectPath(params.topology, projectPath)
    if (match === undefined || match.kind === "ignore") continue
    if (params.include === "content" && match.kind !== "content") continue
    matches.push(match)
  }
  return matches.sort((left, right) => Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath)))
}

function resolveOwner(
  topology: CompiledMetadataResourceTopology,
  assignment: CompiledMetadataAssignmentNode
): MetadataProjectResourceOwner | undefined {
  if (assignment.ownerProjectPattern === undefined) return undefined
  const owner = topology.assignments.find(
    (candidate) => candidate.projectPattern === assignment.ownerProjectPattern
  )
  return owner === undefined
    ? undefined
    : {
        assignmentNodeId: owner.id,
        projectPattern: owner.projectPattern,
        itemRule: owner.itemRule,
      }
}

async function listFiles(root: string): Promise<string[]> {
  const files: string[] = []
  const directories = [root]
  while (directories.length > 0) {
    const directory = directories.pop()!
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && (entry.name === ".git" || entry.name === ".nkdk")) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) directories.push(path)
      else if (entry.isFile()) files.push(path)
    }
  }
  return files
}
