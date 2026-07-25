import type { RegisteredProjectSpec } from "../project/projectSpecRegistry"
import {
  joinMetadataPathPatterns,
  matchMetadataPathPattern,
} from "./patterns"
import type {
  CompiledMetadataAssignmentNode,
  CompiledMetadataExternalFileNode,
  CompiledMetadataIgnoredPathNode,
  CompiledMetadataPathIndex,
  CompiledMetadataResourceTopology,
  CompiledMetadataXmlDocumentNode,
  MetadataContentDeclaration,
  MetadataResourceDeclaration,
} from "./types"

interface CompileContext {
  readonly projectBasePattern: string
  readonly xmlBasePattern: string
  readonly ownerProjectPattern?: string
}

interface MutableAssignment extends MetadataContentDeclaration {
  readonly id: string
  readonly ownerProjectPattern?: string
  readonly xmlDocuments: CompiledMetadataXmlDocumentNode[]
  readonly externalFiles: CompiledMetadataExternalFileNode[]
}

export function compileMetadataResourceTopology(
  specs: readonly RegisteredProjectSpec[]
): CompiledMetadataResourceTopology {
  const assignments: MutableAssignment[] = []
  const ignoredPaths: CompiledMetadataIgnoredPathNode[] = []

  for (const spec of specs) {
    compileDeclarations(spec.resources ?? [], {
      projectBasePattern: "",
      xmlBasePattern: "",
    }, assignments, ignoredPaths)
  }

  assertUniqueAssignmentPaths(assignments)
  assertUniqueXmlOwners(assignments)

  const frozenAssignments = assignments.map(freezeAssignment)
  return Object.freeze({
    assignments: Object.freeze(frozenAssignments),
    ignoredPaths: Object.freeze(ignoredPaths),
    projectIndex: createPathIndex([
      ...frozenAssignments.map((assignment) => [assignment.id, assignment.projectPattern] as const),
      ...frozenAssignments.flatMap((assignment) =>
        assignment.externalFiles.map((file) => [file.id, file.projectPattern] as const)
      ),
      ...ignoredPaths
        .filter((path) => path.side === "project")
        .map((path) => [path.id, path.pattern] as const),
    ]),
    xmlIndex: createPathIndex([
      ...frozenAssignments.flatMap((assignment) =>
        assignment.xmlDocuments.map((document) => [document.id, document.xmlPattern] as const)
      ),
      ...frozenAssignments.flatMap((assignment) =>
        assignment.externalFiles.map((file) => [file.id, file.xmlPattern] as const)
      ),
      ...ignoredPaths
        .filter((path) => path.side === "xml")
        .map((path) => [path.id, path.pattern] as const),
    ]),
  })
}

function compileDeclarations(
  declarations: readonly MetadataResourceDeclaration[],
  context: CompileContext,
  assignments: MutableAssignment[],
  ignoredPaths: CompiledMetadataIgnoredPathNode[]
): void {
  let currentAssignment: MutableAssignment | undefined

  for (const declaration of declarations) {
    if (declaration.kind === "content") {
      const projectPattern = joinMetadataPathPatterns(context.projectBasePattern, declaration.projectPattern)
      currentAssignment = {
        ...declaration,
        id: stableId("assignment", projectPattern, declaration.role, declaration.source.description),
        projectPattern,
        ...(context.ownerProjectPattern === undefined
          ? {}
          : { ownerProjectPattern: context.ownerProjectPattern }),
        xmlDocuments: [],
        externalFiles: [],
      }
      assignments.push(currentAssignment)
      continue
    }

    if (declaration.kind === "childCollection") {
      compileDeclarations(
        declaration.declarations,
        {
          projectBasePattern: joinMetadataPathPatterns(context.projectBasePattern, declaration.projectBasePattern),
          xmlBasePattern: joinMetadataPathPatterns(context.xmlBasePattern, declaration.xmlBasePattern),
          ...(currentAssignment === undefined ? {} : { ownerProjectPattern: currentAssignment.projectPattern }),
        },
        assignments,
        ignoredPaths
      )
      continue
    }

    if (declaration.kind === "ignore") {
      const pattern =
        declaration.side === "project"
          ? joinMetadataPathPatterns(context.projectBasePattern, declaration.pattern)
          : joinMetadataPathPatterns(context.xmlBasePattern, declaration.pattern)
      ignoredPaths.push({
        ...declaration,
        id: stableId("ignore", declaration.side, pattern, declaration.source.description),
        pattern,
      })
      continue
    }

    const assignment = resolveAssignment(declaration.assignmentProjectPattern, context, currentAssignment, assignments)
    if (declaration.kind === "xmlDocument") {
      const xmlPattern = joinMetadataPathPatterns(context.xmlBasePattern, declaration.xmlPattern)
      if (declaration.required && declaration.prepareCapabilityId === undefined) {
        throw new Error(
          `Обязательный XML-документ ${xmlPattern} не имеет возможности подготовки (${declaration.source.description})`
        )
      }
      assignment.xmlDocuments.push({
        ...declaration,
        id: stableId("xml", assignment.projectPattern, xmlPattern, declaration.role),
        xmlPattern,
      })
      continue
    }

    assignment.externalFiles.push({
      ...declaration,
      id: stableId("external", assignment.projectPattern, declaration.projectPattern, declaration.xmlPattern),
      projectPattern: joinMetadataPathPatterns(context.projectBasePattern, declaration.projectPattern),
      xmlPattern: joinMetadataPathPatterns(context.xmlBasePattern, declaration.xmlPattern),
    })
  }
}

function resolveAssignment(
  assignmentProjectPattern: string,
  context: CompileContext,
  currentAssignment: MutableAssignment | undefined,
  assignments: readonly MutableAssignment[]
): MutableAssignment {
  if (assignmentProjectPattern === "") {
    if (currentAssignment === undefined) throw new Error("XML-ресурс объявлен до содержательного файла")
    return currentAssignment
  }

  const fullPattern = joinMetadataPathPatterns(context.projectBasePattern, assignmentProjectPattern)
  const assignment = assignments.find((candidate) => candidate.projectPattern === fullPattern)
  if (assignment === undefined) throw new Error(`Не найдено задание-владелец: ${fullPattern}`)
  return assignment
}

function assertUniqueAssignmentPaths(assignments: readonly MutableAssignment[]): void {
  assertUnique(
    assignments.map((assignment) => [assignment.projectPattern, assignment.projectPattern] as const),
    "Содержательный путь принадлежит нескольким заданиям"
  )
}

function assertUniqueXmlOwners(assignments: readonly MutableAssignment[]): void {
  assertUnique(
    assignments.flatMap((assignment) =>
      assignment.xmlDocuments.map((document) => [document.xmlPattern, assignment.projectPattern] as const)
    ),
    "XML-путь принадлежит нескольким заданиям"
  )
}

function assertUnique(entries: readonly (readonly [string, string])[], message: string): void {
  const owners = new Map<string, string>()
  for (const [path, owner] of entries) {
    const previous = owners.get(path)
    if (previous !== undefined) throw new Error(`${message}: ${path}: ${previous} и ${owner}`)
    owners.set(path, owner)
  }
}

function freezeAssignment(assignment: MutableAssignment): CompiledMetadataAssignmentNode {
  return Object.freeze({
    ...assignment,
    xmlDocuments: Object.freeze([...assignment.xmlDocuments]),
    externalFiles: Object.freeze([...assignment.externalFiles]),
  })
}

function createPathIndex(entries: readonly (readonly [string, string])[]): CompiledMetadataPathIndex {
  const frozenEntries = Object.freeze([...entries])
  return Object.freeze({
    match(path: string) {
      return frozenEntries.flatMap(([nodeId, pattern]) => {
        const values = matchMetadataPathPattern(pattern, path)
        return values === undefined ? [] : [{ nodeId, values }]
      })
    },
  })
}

function stableId(...parts: readonly string[]): string {
  return parts.join("\u0000")
}
