import { promises as nodeFs } from "fs"
import { isAbsolute, join, relative, resolve } from "path"
import { createImportAssignments, type ImportAssignmentGroup } from "./assignmentBuilder"
import { compileXmlImportRouteStructure, matchXmlImportRouteStructure, type XmlImportRouteMatch } from "./routeStructure"
import type { ImportAssignment, ImportExternalFile, ImportXmlInput, XmlImportRoute } from "./types"

export interface XmlImportDiscoveryFileSystem {
  listFiles: (xmlDir: string) => Promise<readonly string[]>
  readFile?: (path: string, encoding?: BufferEncoding) => Promise<unknown>
}

export interface DiscoverXmlImportParams {
  xmlDir: string
  routes: readonly XmlImportRoute[]
  fs?: XmlImportDiscoveryFileSystem
}

type ResolvedMatch = XmlImportRouteMatch

export async function discoverXmlImport(params: DiscoverXmlImportParams): Promise<{ assignments: ImportAssignment[] }> {
  const fileSystem = params.fs ?? defaultFileSystem
  const routeStructure = compileXmlImportRouteStructure(params.routes)
  const listedPaths = await fileSystem.listFiles(params.xmlDir)
  const paths = [...new Set(listedPaths.map((path) => normalizeListedPath(params.xmlDir, path)))].sort(compareUtf8)
  const conflictPaths: string[] = []
  const assignmentsByTarget = new Map<string, ImportAssignmentGroup>()
  const externalMatches: Array<Extract<ResolvedMatch, { kind: "externalFile" }> & { path: string }> = []

  for (const path of paths) {
    const allMatches = matchXmlImportRouteStructure(routeStructure, path)
    const matches = allMatches.some((match) => match.kind !== "externalFile" || match.route.fallback !== true)
      ? allMatches.filter((match) => match.kind !== "externalFile" || match.route.fallback !== true)
      : allMatches
    if (matches.length === 0) continue
    const compatibleMatches = resolveCompatibleMatches(matches)
    if (compatibleMatches === undefined) {
      conflictPaths.push(path)
      continue
    }
    const compatible = compatibleMatches[0]
    if (compatible.kind === "ignore") continue
    if (compatible.kind === "externalFile") {
      for (const match of compatibleMatches) {
        if (match.kind !== "externalFile") throw new Error("Несовместимые виды XML-import маршрутов")
        externalMatches.push({ ...match, path })
      }
      continue
    }

    const existing = assignmentsByTarget.get(compatible.targetProjectPath)
    if (
      existing !== undefined &&
      (existing.route.role !== compatible.route.role || existing.route.itemType !== compatible.route.itemType)
    ) {
      conflictPaths.push(path)
      continue
    }
    const group =
      existing ??
      ({
        route: compatible.route,
        values: compatible.values,
        targetProjectPath: compatible.targetProjectPath,
        xmlFiles: [],
        externalFiles: [],
      } satisfies ImportAssignmentGroup)
    group.xmlFiles.push({
      role: assignmentInputRole(compatible.route),
      sourcePath: resolve(params.xmlDir, ...path.split("/")),
    })
    assignmentsByTarget.set(compatible.targetProjectPath, group)
  }

  if (conflictPaths.length > 0) throw importDiscoveryError("xml_import_route_conflict", conflictPaths)

  for (const match of externalMatches) {
    const assignment = assignmentsByTarget.get(match.assignmentTargetProjectPath)
    if (assignment === undefined) {
      throw importDiscoveryError("xml_import_assignment_missing", [match.path])
    }
    assignment.externalFiles.push({
      sourcePath: resolve(params.xmlDir, ...match.path.split("/")),
      targetProjectPath: match.targetProjectPath,
    })
  }

  const assignments = createImportAssignments([...assignmentsByTarget.values()])

  assertUnique(assignments, (assignment) => assignment.targetProjectPath, "Повторный целевой YAML")
  const externalFiles = assignments.flatMap((assignment) => assignment.externalFiles)
  assertUnique(externalFiles, (file) => file.targetProjectPath, "Повторный внешний файл")
  assertNoCrossKindTargetConflicts(assignments, externalFiles)
  assertEveryMetadataXmlBelongsToOneAssignment(assignments)
  assertEveryExternalFileBelongsToOneAssignment(assignments)

  return { assignments }
}

const defaultFileSystem: XmlImportDiscoveryFileSystem = {
  listFiles: listRegularFiles,
}

async function listRegularFiles(xmlDir: string): Promise<string[]> {
  const DISCOVERY_READDIR_CONCURRENCY = 32
  const result: string[] = []
  const dirs = [""]
  let active = 0
  let resolveDone!: () => void
  let rejectDone!: (error: unknown) => void
  const done = new Promise<void>((resolveDoneCallback, rejectDoneCallback) => {
    resolveDone = resolveDoneCallback
    rejectDone = rejectDoneCallback
  })

  const pump = (): void => {
    while (active < DISCOVERY_READDIR_CONCURRENCY && dirs.length > 0) {
      const relativeDir = dirs.pop()!
      const directory = relativeDir === "" ? xmlDir : join(xmlDir, ...relativeDir.split("/"))
      active += 1
      nodeFs
        .readdir(directory, { withFileTypes: true })
        .then(
          (entries) => {
            for (const entry of entries) {
              const path = relativeDir === "" ? entry.name : `${relativeDir}/${entry.name}`
              if (entry.isDirectory()) dirs.push(path)
              else if (entry.isFile()) result.push(path)
            }
          },
          (error: unknown) => rejectDone(error)
        )
        .finally(() => {
          active -= 1
          if (active === 0 && dirs.length === 0) resolveDone()
          else pump()
        })
    }
  }

  pump()
  await done
  return result
}

function normalizeListedPath(xmlDir: string, path: string): string {
  const normalized = path.replace(/\\/g, "/")
  if (!isAbsolute(path)) {
    const relativePath = normalized.replace(/^\.\//, "")
    if (relativePath === "" || relativePath === ".." || relativePath.startsWith("../")) {
      throw importDiscoveryError("xml_import_path_outside_dump", [path])
    }
    return relativePath
  }
  const relativePath = relative(resolve(xmlDir), resolve(path)).replace(/\\/g, "/")
  if (relativePath === "" || relativePath === ".." || relativePath.startsWith("../")) {
    throw importDiscoveryError("xml_import_path_outside_dump", [path])
  }
  return relativePath
}

function resolveCompatibleMatches(matches: readonly ResolvedMatch[]): ResolvedMatch[] | undefined {
  const unique = new Map(matches.map((match) => [resolvedMatchKey(match), match]))
  const values = [...unique.values()]
  if (values.length === 1) return values
  if (
    values.every((match) => match.kind === "externalFile") &&
    new Set(values.map((match) => (match.kind === "externalFile" ? match.assignmentTargetProjectPath : ""))).size === 1
  ) {
    return values
  }
  return undefined
}

function resolvedMatchKey(match: ResolvedMatch): string {
  if (match.kind === "ignore") return "ignore"
  if (match.kind === "assignment") {
    return `${match.kind}\0${match.targetProjectPath}\0${match.route.role}\0${match.route.itemType}\0${assignmentInputRole(match.route)}`
  }
  return `${match.kind}\0${match.targetProjectPath}\0${match.assignmentTargetProjectPath}`
}

function assignmentInputRole(route: Extract<XmlImportRoute, { kind: "assignment" }>): ImportXmlInput["role"] {
  return route.inputRole ?? (route.role === "fileItem" || route.source.kind === "itemRule" ? "metadata" : "property")
}

function assertUnique<T>(items: readonly T[], key: (item: T) => string, message: string): void {
  const values = new Set<string>()
  for (const item of items) {
    const value = key(item)
    if (values.has(value)) throw new Error(`${message}: ${value}`)
    values.add(value)
  }
}

function assertNoCrossKindTargetConflicts(
  assignments: readonly ImportAssignment[],
  externalFiles: readonly ImportExternalFile[]
): void {
  const assignmentTargets = new Set(assignments.map((assignment) => assignment.targetProjectPath))
  const conflict = externalFiles.find((file) => assignmentTargets.has(file.targetProjectPath))
  if (conflict !== undefined) throw new Error(`Конфликт типов целевого файла: ${conflict.targetProjectPath}`)
}

function assertEveryMetadataXmlBelongsToOneAssignment(assignments: readonly ImportAssignment[]): void {
  assertUnique(
    assignments.flatMap((assignment) => assignment.xmlFiles),
    (file) => file.sourcePath,
    "XML принадлежит нескольким заданиям"
  )
}

function assertEveryExternalFileBelongsToOneAssignment(assignments: readonly ImportAssignment[]): void {
  const assignmentBySource = new Map<string, string>()
  for (const assignment of assignments) {
    for (const sourcePath of new Set(assignment.externalFiles.map((file) => file.sourcePath))) {
      const previousAssignment = assignmentBySource.get(sourcePath)
      if (previousAssignment !== undefined && previousAssignment !== assignment.id) {
        throw new Error(`Внешний файл принадлежит нескольким заданиям: ${sourcePath}`)
      }
      assignmentBySource.set(sourcePath, assignment.id)
    }
  }
}

function importDiscoveryError(code: string, paths: readonly string[]): Error & { code: string; paths: string[] } {
  return Object.assign(new Error(`${code}: ${paths.join(", ")}`), { code, paths: [...paths].sort(compareUtf8) })
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
