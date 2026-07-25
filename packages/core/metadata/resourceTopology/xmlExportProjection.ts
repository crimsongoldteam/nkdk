import { expandMetadataPathPattern } from "./patterns"
import type { MetadataProjectResourceMatch } from "./projectProjection"
import type {
  CompiledMetadataAssignmentNode,
  CompiledMetadataExternalFileNode,
  CompiledMetadataResourceTopology,
  CompiledMetadataXmlDocumentNode,
} from "./types"
import { classifyMetadataProjectPath } from "./projectProjection"

export interface XmlExportPotentialOutput {
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly role: "metadata" | "body" | "property"
  readonly required: boolean
  readonly prepareCapabilityId: string
}

export interface XmlExportAssignmentProjection {
  readonly nodeId: string
  readonly assignmentRole: "configuration" | "properties" | "fileItem"
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly owner?: {
    readonly itemType: string
    readonly name: string
    readonly logicalAddress: string
  }
  readonly potentialOutputs: readonly XmlExportPotentialOutput[]
}

export interface XmlExportOwnerProjection {
  readonly nodeId: string
  readonly assignment: CompiledMetadataAssignmentNode
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
}

export interface MetadataProjectChangeImpact {
  readonly assignment: CompiledMetadataAssignmentNode | undefined
  readonly outputs: readonly CompiledMetadataXmlDocumentNode[]
  readonly externalFile: CompiledMetadataExternalFileNode | undefined
  readonly compositionImpact: "none" | "configurationComposition"
  readonly values: Readonly<Record<string, string>>
}

export function resolveMetadataProjectChangeImpact(
  topology: CompiledMetadataResourceTopology,
  projectPath: string
): MetadataProjectChangeImpact | undefined {
  const match = classifyMetadataProjectPath(topology, projectPath)
  if (match === undefined || match.kind === "ignore") return undefined
  if (match.kind === "externalFile") {
    return {
      assignment: match.assignment,
      outputs: [],
      externalFile: match.externalFile,
      compositionImpact: match.compositionImpact,
      values: match.values,
    }
  }
  return {
    assignment: match.assignment,
    outputs: (match.assignment?.xmlDocuments ?? []).filter(
      (document) => document.prepareCapabilityId !== undefined
    ),
    externalFile: undefined,
    compositionImpact: match.compositionImpact,
    values: match.values,
  }
}

export function projectXmlExportAssignment(
  topology: CompiledMetadataResourceTopology,
  match: MetadataProjectResourceMatch
): XmlExportAssignmentProjection {
  const assignment = requireContentAssignment(match)
  const itemName = itemNameFor(assignment, match.values)
  const ownerProjection = projectXmlExportOwnerChain(topology, match).at(-1)
  const owner =
    ownerProjection === undefined
      ? undefined
      : {
          itemType: ownerProjection.itemType,
          name: ownerProjection.itemName,
          logicalAddress: ownerProjection.logicalAddress,
        }
  const logicalAddress =
    owner === undefined
      ? rootLogicalAddress(assignment, match.values, itemName)
      : [owner.logicalAddress, assignment.logicalAddressSegment, itemName].filter(Boolean).join(".")
  return {
    nodeId: assignment.id,
    assignmentRole: assignment.role,
    itemType: assignment.itemRule.itemType,
    itemName,
    logicalAddress,
    ...(owner === undefined ? {} : { owner }),
    potentialOutputs: assignment.xmlDocuments
      .filter((document): document is typeof document & { prepareCapabilityId: string } =>
        document.prepareCapabilityId !== undefined
      )
      .map((document) => ({
      declarationId: document.id,
      targetXmlPath: expandMetadataPathPattern(document.xmlPattern, match.values),
      role: document.role,
      required: document.required,
      prepareCapabilityId: document.prepareCapabilityId,
    })),
  }
}

export function projectXmlExportOwnerChain(
  topology: CompiledMetadataResourceTopology,
  match: MetadataProjectResourceMatch
): readonly XmlExportOwnerProjection[] {
  const assignment = requireContentAssignment(match)
  const owners: CompiledMetadataAssignmentNode[] = []
  const visited = new Set<string>([assignment.id])
  let current = assignment

  while (current.ownerProjectPattern !== undefined) {
    const owner = topology.assignments.find(
      (candidate) => candidate.projectPattern === current.ownerProjectPattern
    )
    if (owner === undefined) throw new Error(`Не найден узел-владелец ${current.ownerProjectPattern}`)
    if (visited.has(owner.id)) throw new Error(`Цикл узлов-владельцев топологии: ${owner.projectPattern}`)
    visited.add(owner.id)
    owners.push(owner)
    current = owner
  }

  let previous: XmlExportOwnerProjection | undefined
  return owners.reverse().map((owner) => {
    const itemName = itemNameFor(owner, match.values)
    const logicalAddress =
      previous === undefined
        ? rootLogicalAddress(owner, match.values, itemName)
        : [previous.logicalAddress, owner.logicalAddressSegment, itemName].filter(Boolean).join(".")
    const projected = {
      nodeId: owner.id,
      assignment: owner,
      itemType: owner.itemRule.itemType,
      itemName,
      logicalAddress,
    }
    previous = projected
    return projected
  })
}

function rootLogicalAddress(
  assignment: CompiledMetadataAssignmentNode,
  values: Readonly<Record<string, string>>,
  itemName: string
): string {
  if (assignment.role === "configuration") return "Конфигурация"
  const dir = assignment.projectPattern.split("/")[0] ?? assignment.itemRule.itemType
  const names = [
    values.ownerName,
    ...Object.entries(values)
      .filter(([key]) => /^recursiveItemName\d+$/.test(key))
      .sort(([left], [right]) => numericSuffix(left) - numericSuffix(right))
      .map(([, value]) => value),
  ].filter((value): value is string => value !== undefined)
  return [dir, ...(names.length === 0 ? [itemName] : names)].join(".")
}

function itemNameFor(
  assignment: CompiledMetadataAssignmentNode,
  values: Readonly<Record<string, string>>
): string {
  const parameters = [...assignment.projectPattern.matchAll(/\{([^}.]+)(?:\.\.\.)?\}/g)].map((match) => match[1]!)
  for (const parameter of parameters.reverse()) {
    const value = values[parameter]
    if (value !== undefined) return value
  }
  return assignment.role === "configuration" ? "Конфигурация" : ""
}

function numericSuffix(value: string): number {
  return Number(value.replace(/\D/g, ""))
}

function requireContentAssignment(match: MetadataProjectResourceMatch): CompiledMetadataAssignmentNode {
  if (match.kind !== "content" || match.assignment === undefined) {
    throw new Error("XML-export требует содержательный ресурс")
  }
  return match.assignment
}
