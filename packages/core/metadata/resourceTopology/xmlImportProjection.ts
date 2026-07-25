import { expandMetadataPathPattern } from "./patterns"
import type {
  CompiledMetadataAssignmentNode,
  CompiledMetadataExternalFileNode,
  CompiledMetadataIgnoredPathNode,
  CompiledMetadataResourceTopology,
  CompiledMetadataXmlDocumentNode,
} from "./types"

export interface XmlImportTopologyProjection {
  readonly topology: CompiledMetadataResourceTopology
  readonly assignmentsById: ReadonlyMap<string, CompiledMetadataAssignmentNode>
  readonly xmlDocumentsById: ReadonlyMap<
    string,
    { readonly node: CompiledMetadataXmlDocumentNode; readonly assignment: CompiledMetadataAssignmentNode }
  >
  readonly externalFilesById: ReadonlyMap<
    string,
    { readonly node: CompiledMetadataExternalFileNode; readonly assignment: CompiledMetadataAssignmentNode }
  >
  readonly ignoredPathsById: ReadonlyMap<string, CompiledMetadataIgnoredPathNode>
}

export type CompiledXmlResourceMatch =
  | {
      readonly kind: "xmlDocument"
      readonly node: CompiledMetadataXmlDocumentNode
      readonly assignment: CompiledMetadataAssignmentNode
      readonly assignmentProjectPath: string
      readonly values: Readonly<Record<string, string>>
    }
  | {
      readonly kind: "externalFile"
      readonly node: CompiledMetadataExternalFileNode
      readonly assignment: CompiledMetadataAssignmentNode
      readonly projectPath: string
      readonly assignmentProjectPath: string
      readonly values: Readonly<Record<string, string>>
    }
  | {
      readonly kind: "ignore"
      readonly node: CompiledMetadataIgnoredPathNode
      readonly values: Readonly<Record<string, string>>
    }

export function projectXmlImportTopology(
  topology: CompiledMetadataResourceTopology
): XmlImportTopologyProjection {
  const assignmentsById = new Map(topology.assignments.map((assignment) => [assignment.id, assignment]))
  const xmlDocumentsById = new Map(
    topology.assignments.flatMap((assignment) =>
      assignment.xmlDocuments.map((node) => [node.id, { node, assignment }] as const)
    )
  )
  const externalFilesById = new Map(
    topology.assignments.flatMap((assignment) =>
      assignment.externalFiles
        .filter((node) => node.direction !== "projectToXml")
        .map((node) => [node.id, { node, assignment }] as const)
    )
  )
  const ignoredPathsById = new Map(
    topology.ignoredPaths.filter((node) => node.side === "xml").map((node) => [node.id, node])
  )
  return Object.freeze({
    topology,
    assignmentsById,
    xmlDocumentsById,
    externalFilesById,
    ignoredPathsById,
  })
}

export function matchXmlImportResource(
  projection: XmlImportTopologyProjection,
  xmlPath: string
): readonly CompiledXmlResourceMatch[] {
  return projection.topology.xmlIndex.match(xmlPath).flatMap((match): readonly CompiledXmlResourceMatch[] => {
    const document = projection.xmlDocumentsById.get(match.nodeId)
    if (document !== undefined) {
      return [
        {
          kind: "xmlDocument",
          ...document,
          assignmentProjectPath: expandMetadataPathPattern(document.assignment.projectPattern, match.values),
          values: match.values,
        },
      ]
    }
    const external = projection.externalFilesById.get(match.nodeId)
    if (external !== undefined) {
      return [
        {
          kind: "externalFile",
          ...external,
          projectPath: expandMetadataPathPattern(external.node.projectPattern, match.values),
          assignmentProjectPath: expandMetadataPathPattern(external.assignment.projectPattern, match.values),
          values: match.values,
        },
      ]
    }
    const ignored = projection.ignoredPathsById.get(match.nodeId)
    return ignored === undefined ? [] : [{ kind: "ignore", node: ignored, values: match.values }]
  })
}
