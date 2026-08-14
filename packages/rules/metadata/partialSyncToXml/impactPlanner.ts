import { posix } from "node:path"
import type { XmlSyncSelection } from "../fullSyncToXml/selection"
import type { ProjectStateYamlPath } from "../projectState/fileUpdate"
import { expandMetadataPathPattern } from "../resourceTopology/core/patterns"
import {
  classifyMetadataProjectPath,
  type MetadataProjectResourceMatch,
} from "../resourceTopology/core/projectProjection"
import type {
  CompiledMetadataAssignmentNode,
  CompiledMetadataResourceTopology,
  CompiledMetadataXmlDocumentNode,
} from "@nkdk/runtime/rule-kit"
import { resolveMetadataProjectChangeImpact } from "../resourceTopology/core/xmlExportProjection"
import type { PartialXmlChanges } from "./types"
import type {
  ResolvedPartialXmlAssignmentPolicy,
  ResolvedPartialXmlPackagePolicies,
} from "./packagePolicy"

export interface PartialXmlImpactPlan {
  readonly selection: XmlSyncSelection
  readonly assignmentDocumentIds: ReadonlyMap<string, ReadonlySet<string>>
  readonly externalProjectPaths: readonly string[]
  readonly loadTargets: readonly string[]
}

export function buildPartialXmlImpactPlan(params: {
  readonly topology: CompiledMetadataResourceTopology
  readonly currentResources: readonly MetadataProjectResourceMatch[]
  readonly changes: PartialXmlChanges
  readonly policies: ResolvedPartialXmlPackagePolicies
  readonly referencesFor: (sourceProjectPath: string) => readonly {
    readonly yamlPath: ProjectStateYamlPath
    readonly canonical: string
  }[]
  readonly resolveCanonicalTarget: (canonical: string) => string | undefined
}): PartialXmlImpactPlan {
  const currentByPath = uniqueCurrentResources(params.currentResources)
  const selectedProjectPaths = new Set<string>()
  const assignmentDocumentIds = new Map<string, Set<string>>()
  const externalProjectPaths = new Set<string>()
  const loadTargets = new Set<string>()
  const payloadOwnersByTarget = new Map<string, string>()
  const assignmentStates = new Map<string, { payload: boolean; load: boolean }>()
  const structurallyDeletedCollections = new Set<string>()
  const handledDeletedContent = new Set<string>()
  const deletedCompositionPaths = new Set(params.changes.deleted.flatMap((version) => {
    const impact = resolveMetadataProjectChangeImpact(params.topology, version.projectPath)
    return impact?.compositionImpact === "configurationComposition"
      ? [version.projectPath]
      : []
  }))
  const deletedCompositionDirectories = new Set([...deletedCompositionPaths].map(posix.dirname))

  for (const version of params.changes.deleted) {
    if (isInsideDeletedComposition(version.projectPath)) {
      handledDeletedContent.add(version.projectPath)
      continue
    }
    const match = classifyDeletedPath(version.projectPath)
    if (match?.kind !== "content" || match.assignment?.fileBackedTarget === undefined) continue
    const policy = params.policies.assignments.get(match.assignment.id)
    if (policy?.structural === undefined) continue
    includeMemberCollection(match, policy)
    structurallyDeletedCollections.add(memberCollectionKey(match))
    handledDeletedContent.add(version.projectPath)
  }

  for (const version of params.changes.changed.map(({ current }) => current)) {
    const match = classifyChangedPath(version.projectPath)
    if (match === undefined || match.kind === "ignore") continue
    const current = requiredCurrentResource(version.projectPath)
    includeDirectCurrent(current)
  }

  for (const version of params.changes.added) {
    const match = classifyChangedPath(version.projectPath)
    if (match === undefined || match.kind === "ignore") continue
    const current = requiredCurrentResource(version.projectPath)
    includeDirectCurrent(current)
    if (current.kind === "content" && current.assignment?.fileBackedTarget !== undefined) {
      const policy = params.policies.assignments.get(current.assignment.id)
      if (policy?.structural === undefined) {
        throw new Error(`Для файлового metadata-ресурса отсутствует структурная политика: ${version.projectPath}`)
      }
      includeMemberCollection(current, policy)
    } else if (current.compositionImpact === "configurationComposition") {
      includeCurrentAssignmentSubtree(current)
      includeConfigurationRoot()
    }
  }

  for (const version of params.changes.deleted) {
    if (handledDeletedContent.has(version.projectPath)) continue
    const match = classifyDeletedPath(version.projectPath)
    if (match === undefined || match.kind === "ignore") continue
    if (match.kind === "externalFile") {
      if (match.assignment?.fileBackedTarget !== undefined &&
        structurallyDeletedCollections.has(memberCollectionKey(match))) continue
      throw new Error(`Удалённый внешний файл нельзя включить в XML-пакет: ${version.projectPath}`)
    }
    if (match.kind === "yamlCompanion") {
      includeYamlCompanionOwner(match)
      continue
    }
    if (match.compositionImpact === "configurationComposition") {
      includeConfigurationRoot()
      continue
    }
    throw new Error(`Для удаления отсутствует правило влияния: ${version.projectPath}`)
  }

  const sortedAssignmentEntries = [...assignmentDocumentIds]
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([projectPath, ids]) => [
      projectPath,
      new Set([...ids].sort(compareUtf8)) as ReadonlySet<string>,
    ] as const)

  return {
    selection: {
      kind: "selected",
      projectPaths: [...selectedProjectPaths].sort(compareUtf8),
    },
    assignmentDocumentIds: new Map(sortedAssignmentEntries),
    externalProjectPaths: [...externalProjectPaths].sort(compareUtf8),
    loadTargets: [...loadTargets].sort(compareUtf8),
  }

  function classifyChangedPath(projectPath: string): MetadataProjectResourceMatch | undefined {
    const current = currentByPath.get(projectPath)
    if (current !== undefined) return current
    const match = classifyMetadataProjectPath(params.topology, projectPath)
    if (match === undefined) throw new Error(`Изменённый путь не классифицирован топологией: ${projectPath}`)
    return match
  }

  function isInsideDeletedComposition(projectPath: string): boolean {
    return !deletedCompositionPaths.has(projectPath)
      && [...deletedCompositionDirectories].some((directory) => projectPath.startsWith(`${directory}/`))
  }

  function classifyDeletedPath(projectPath: string): MetadataProjectResourceMatch | undefined {
    const impact = resolveMetadataProjectChangeImpact(params.topology, projectPath)
    if (impact === undefined) {
      const classified = classifyMetadataProjectPath(params.topology, projectPath)
      if (classified?.kind === "ignore") return classified
      throw new Error(`Изменённый путь не классифицирован топологией: ${projectPath}`)
    }
    const classified = classifyMetadataProjectPath(params.topology, projectPath)
    if (classified === undefined || classified.kind === "ignore") {
      throw new Error(`Топология потеряла влияние удалённого пути: ${projectPath}`)
    }
    return classified
  }

  function requiredCurrentResource(projectPath: string): MetadataProjectResourceMatch {
    const current = currentByPath.get(projectPath)
    if (current === undefined) throw new Error(`Изменённый текущий ресурс отсутствует: ${projectPath}`)
    return current
  }

  function includeDirectCurrent(resource: MetadataProjectResourceMatch): void {
    if (resource.kind === "content") {
      includeAssignment(resource, true)
    } else if (resource.kind === "externalFile") {
      includeExternal(resource, true)
    } else if (resource.kind === "yamlCompanion") {
      includeYamlCompanionOwner(resource)
    }
  }

  function includeYamlCompanionOwner(resource: MetadataProjectResourceMatch): void {
    const assignment = resource.assignment
    const companion = resource.yamlCompanion
    if (assignment === undefined || companion === undefined) {
      throw new Error(`YAML-спутник не связан с XML-заданием: ${resource.projectPath}`)
    }
    const policy = params.policies.assignments.get(assignment.id)
    if (!policy?.yamlCompanionInputIds.includes(companion.id)) {
      throw new Error(`YAML-спутник не зарегистрирован как вход задания: ${resource.projectPath}`)
    }
    const assignmentPath = expandMetadataPathPattern(assignment.projectPattern, resource.values)
    const owner = currentByPath.get(assignmentPath)
    if (owner?.kind !== "content") {
      throw new Error(`Для YAML-спутника не найдено текущее XML-задание: ${resource.projectPath}`)
    }
    includeAssignment(owner, true)
  }

  function includeAssignment(resource: MetadataProjectResourceMatch, requestLoad: boolean): void {
    if (resource.kind !== "content" || resource.assignment === undefined) {
      throw new Error(`Ожидалось XML-задание: ${resource.projectPath}`)
    }
    const assignment = resource.assignment
    const policy = params.policies.assignments.get(assignment.id)
    const state = assignmentStates.get(resource.projectPath) ?? { payload: false, load: false }
    assignmentStates.set(resource.projectPath, state)
    selectedProjectPaths.add(resource.projectPath)

    if (!state.payload) {
      state.payload = true
      for (const document of assignment.xmlDocuments.filter((candidate) => candidate.required)) {
        addDocument(resource, document, false)
      }
      for (const companion of policy?.companionDocuments ?? []) {
        addDocument(resource, requiredDocument(assignment, companion.documentId), companion.loadTarget)
      }
      for (const companion of policy?.companionReferences ?? []) includeReferenceCompanion(resource, companion)
    }

    if (requestLoad && !state.load) {
      state.load = true
      const loadDocumentIds = policy?.loadDocumentIds ?? assignment.xmlDocuments
        .filter((document) => document.required)
        .map((document) => document.id)
      for (const documentId of loadDocumentIds) {
        addDocument(resource, requiredDocument(assignment, documentId), true)
      }
    }
  }

  function includeReferenceCompanion(
    sourceResource: MetadataProjectResourceMatch,
    companion: ResolvedPartialXmlAssignmentPolicy["companionReferences"][number],
  ): void {
    const reference = params.referencesFor(sourceResource.projectPath).find((candidate) =>
      sameYamlPath(candidate.yamlPath, companion.yamlPath)
    )
    if (reference === undefined) {
      throw new Error(
        `Не найдена сохранённая каноническая ссылка ${formatYamlPath(companion.yamlPath)} в ${sourceResource.projectPath}`
      )
    }
    const targetPath = params.resolveCanonicalTarget(reference.canonical)
    if (targetPath === undefined) throw new Error(`Не разрешена каноническая цель: ${reference.canonical}`)
    const target = currentByPath.get(targetPath)
    if (target?.kind !== "content") throw new Error(`Каноническая цель не является текущим XML-заданием: ${targetPath}`)
    includeAssignment(target, companion.loadTarget)
  }

  function addDocument(
    resource: MetadataProjectResourceMatch,
    document: CompiledMetadataXmlDocumentNode,
    loadTarget: boolean,
  ): void {
    if (document.prepareCapabilityId === undefined) {
      throw new Error(`XML-документ не имеет возможности подготовки: ${document.xmlPattern}`)
    }
    const target = normalizedXmlPath(expandMetadataPathPattern(document.xmlPattern, resource.values))
    addPayloadTarget(target, `${resource.projectPath}\u0000${document.id}`)
    const ids = assignmentDocumentIds.get(resource.projectPath) ?? new Set<string>()
    ids.add(document.id)
    assignmentDocumentIds.set(resource.projectPath, ids)
    if (loadTarget) loadTargets.add(target)
  }

  function includeExternal(resource: MetadataProjectResourceMatch, requestLoad: boolean): void {
    const external = resource.externalFile
    if (resource.kind !== "externalFile" || external === undefined) {
      throw new Error(`Ожидался внешний файл: ${resource.projectPath}`)
    }
    const target = normalizedXmlPath(expandMetadataPathPattern(external.xmlPattern, resource.values))
    addPayloadTarget(target, resource.projectPath)
    selectedProjectPaths.add(resource.projectPath)
    externalProjectPaths.add(resource.projectPath)
    const policy = params.policies.externalFiles.get(external.id)
    if (requestLoad && (policy?.loadTarget ?? true)) loadTargets.add(target)
  }

  function includeMemberCollection(
    resource: MetadataProjectResourceMatch,
    policy: ResolvedPartialXmlAssignmentPolicy,
  ): void {
    const declaration = resource.assignment?.fileBackedTarget
    if (declaration === undefined || policy.structural === undefined) return
    const ownerPath = expandMetadataPathPattern(declaration.ownerProjectPattern, resource.values)
    if (policy.structural.includeOwnerAssignment) {
      const owner = currentByPath.get(ownerPath)
      if (owner?.kind !== "content") throw new Error(`Не найден текущий владелец файлового metadata: ${ownerPath}`)
      includeAssignment(owner, true)
    }
    if (policy.structural.includeCurrentMemberSubtree) {
      for (const current of currentByPath.values()) {
        const currentDeclaration = current.assignment?.fileBackedTarget
        if (currentDeclaration === undefined || currentDeclaration.memberKind !== declaration.memberKind) continue
        if (expandMetadataPathPattern(currentDeclaration.ownerProjectPattern, current.values) !== ownerPath) continue
        if (current.kind === "content") includeAssignment(current, false)
        if (current.kind === "externalFile") includeExternal(current, false)
      }
    }
  }

  function includeCurrentAssignmentSubtree(resource: MetadataProjectResourceMatch): void {
    const directory = posix.dirname(resource.projectPath)
    for (const current of currentByPath.values()) {
      if (current.projectPath !== resource.projectPath && !current.projectPath.startsWith(`${directory}/`)) continue
      includeDirectCurrent(current)
    }
  }

  function includeConfigurationRoot(): void {
    const roots = [...currentByPath.values()].filter((resource) =>
      resource.kind === "content" && resource.assignment?.role === "configuration"
    )
    if (roots.length !== 1) throw new Error(`Ожидалось одно текущее корневое XML-задание, найдено ${roots.length}`)
    const root = roots[0]!
    includeAssignment(root, true)
    for (const resource of currentByPath.values()) {
      if (resource.kind === "externalFile" && resource.assignment?.id === root.assignment?.id) {
        includeExternal(resource, true)
      }
    }
  }

  function memberCollectionKey(resource: MetadataProjectResourceMatch): string {
    const declaration = resource.assignment?.fileBackedTarget
    if (declaration === undefined) throw new Error(`Ресурс не относится к файловой коллекции: ${resource.projectPath}`)
    return [
      declaration.ownerAssignmentNodeId,
      declaration.memberKind,
      expandMetadataPathPattern(declaration.ownerProjectPattern, resource.values),
    ].join("\u0000")
  }

  function addPayloadTarget(target: string, owner: string): void {
    const previous = payloadOwnersByTarget.get(target)
    if (previous !== undefined && previous !== owner) {
      throw new Error(`Повторный XML-путь ${target}: ${previous} и ${owner}`)
    }
    payloadOwnersByTarget.set(target, owner)
  }
}

function uniqueCurrentResources(
  resources: readonly MetadataProjectResourceMatch[],
): ReadonlyMap<string, MetadataProjectResourceMatch> {
  const byPath = new Map<string, MetadataProjectResourceMatch>()
  for (const resource of resources) {
    if (byPath.has(resource.projectPath)) throw new Error(`Текущий ресурс повторяется: ${resource.projectPath}`)
    byPath.set(resource.projectPath, resource)
  }
  return byPath
}

function requiredDocument(
  assignment: CompiledMetadataAssignmentNode,
  documentId: string,
): CompiledMetadataXmlDocumentNode {
  const document = assignment.xmlDocuments.find((candidate) => candidate.id === documentId)
  if (document === undefined) throw new Error(`Задание ${assignment.projectPattern} не содержит документ ${documentId}`)
  return document
}

function normalizedXmlPath(path: string): string {
  const segments = path.split("/")
  if (
    path === "" ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.includes("\\") ||
    path.includes("\0") ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error(`XML-путь должен быть нормализованным и относительным: ${JSON.stringify(path)}`)
  }
  return path
}

function sameYamlPath(left: ProjectStateYamlPath, right: ProjectStateYamlPath): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}

function formatYamlPath(path: ProjectStateYamlPath): string {
  return path.map(String).join(".")
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
