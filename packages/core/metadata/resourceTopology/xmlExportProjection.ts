import { expandMetadataPathPattern } from "./patterns"
import type { MetadataProjectResourceMatch } from "./projectProjection"
import type { CompiledMetadataAssignmentNode, CompiledMetadataResourceTopology } from "./types"

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

export function projectXmlExportAssignment(
  topology: CompiledMetadataResourceTopology,
  match: MetadataProjectResourceMatch
): XmlExportAssignmentProjection {
  const assignment = requireContentAssignment(match)
  const itemName = itemNameFor(assignment, match.values)
  const owner = ownerFor(topology, assignment, match.values)
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

function ownerFor(
  topology: CompiledMetadataResourceTopology,
  assignment: CompiledMetadataAssignmentNode,
  values: Readonly<Record<string, string>>
): XmlExportAssignmentProjection["owner"] {
  if (assignment.ownerProjectPattern === undefined) return undefined
  const owner = topology.assignments.find(
    (candidate) => candidate.projectPattern === assignment.ownerProjectPattern
  )
  if (owner === undefined) throw new Error(`Не найден узел-владелец ${assignment.ownerProjectPattern}`)
  const ownerName = itemNameFor(owner, values)
  return {
    itemType: owner.itemRule.itemType,
    name: ownerName,
    logicalAddress: rootLogicalAddress(owner, values, ownerName),
  }
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
