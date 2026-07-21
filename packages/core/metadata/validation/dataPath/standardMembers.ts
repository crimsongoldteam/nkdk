import type { MetadataItemRule } from "../../orchestration/property/types"
import type { OwnerMetadata, OwnerMetadataCache } from "./ownerCache"
import { getMetadataLinkPrefixesByOwnerKind, getOwnerKindByMetadataLinkPrefix } from "./registry"
import type { DataPathTableInfo, DataPathTypeInfo, FormDataPathColumnSource, OwnerTypeRef } from "./types"

export type StandardMemberKind = "standardAttribute" | "standardTabularSection" | "standardTabularSectionColumn"
export type StandardMemberPhase = "index-time" | "traversal-time" | "deferred"
export type StandardMemberSourceScope = "self" | "ownerModel" | "rules" | "projectIndex"
export type PrimitiveKind = "boolean" | "string" | "dateTime" | "number"

export interface StandardMemberNames {
  internal: string
  yaml: string
}

interface BaseStandardMemberDeclaration {
  memberKind: StandardMemberKind
  names: StandardMemberNames
  phase: StandardMemberPhase
  sourceScope: StandardMemberSourceScope
}

export interface PrimitiveStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "primitive"
  kind: PrimitiveKind
  terminal?: true
  allowNestedProperties?: false
}

export interface SameOwnerObjectStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "sameOwnerObject"
}

export interface ObjectRefsFromPropertyStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "objectRefsFromProperty"
  property: string
  compositePolicy: "errorOnTraversal"
}

export interface MetadataPropertyScalarStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "codeByProperty" | "numberByProperty"
  property: string
}

export interface ObjectRefFromPropertyStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "objectRefFromProperty"
  property: string
}

export interface StandardEnumStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "standardEnum"
  name: string
}

export interface TypeDescriptionStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "typeDescription"
  allowNestedProperties: false
}

export interface OpaqueStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "opaque"
  allowNestedProperties: false
}

export interface UnsupportedStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "unsupported"
  reason: string
}

export interface ReverseLookupStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "reverseLookup"
  phase: "traversal-time"
  sourceScope: "projectIndex"
  target: string
  property: string
  emptyPolicy: "error"
  compositePolicy: "errorOnTraversal"
}

export interface ClosedReverseLookupStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardAttribute"
  family: "closedReverseLookup"
  phase: "traversal-time"
  sourceScope: "projectIndex"
  target?: string
  result: string
  source: string
  property?: string
  emptyPolicy: "error"
  allowNestedProperties: false
}

export interface StandardTableDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardTabularSection"
  family: "standardTable"
  tableKind: "ValueTable"
  columns: readonly StandardTableColumnDeclaration[]
}

export type StandardTableColumnDeclaration =
  | PrimitiveStandardTableColumnDeclaration
  | SameOwnerObjectStandardTableColumnDeclaration
  | ObjectRefFromOwnerPropertyStandardTableColumnDeclaration

export interface PrimitiveStandardTableColumnDeclaration {
  memberKind: "standardTabularSectionColumn"
  names: StandardMemberNames
  family: "primitive"
  kind: PrimitiveKind
  discoveredFrom?: string
}

export interface SameOwnerObjectStandardTableColumnDeclaration {
  memberKind: "standardTabularSectionColumn"
  names: StandardMemberNames
  family: "sameOwnerObject"
}

export interface ObjectRefFromOwnerPropertyStandardTableColumnDeclaration {
  memberKind: "standardTabularSectionColumn"
  names: StandardMemberNames
  family: "objectRefFromOwnerProperty"
  property: string
}

export type StandardMemberDeclaration =
  | PrimitiveStandardMemberDeclaration
  | SameOwnerObjectStandardMemberDeclaration
  | ObjectRefsFromPropertyStandardMemberDeclaration
  | MetadataPropertyScalarStandardMemberDeclaration
  | ObjectRefFromPropertyStandardMemberDeclaration
  | StandardEnumStandardMemberDeclaration
  | TypeDescriptionStandardMemberDeclaration
  | OpaqueStandardMemberDeclaration
  | UnsupportedStandardMemberDeclaration
  | ReverseLookupStandardMemberDeclaration
  | ClosedReverseLookupStandardMemberDeclaration
  | StandardTableDeclaration

export interface ResolveIndexTimeStandardMemberParams {
  owner: Pick<OwnerMetadata, "ref" | "facts" | "rule">
  internalName: string
  yamlName: string
  explicitTypeInfo?: DataPathTypeInfo
}

export interface ResolvedStandardMember {
  name: string
  targetName: string
  typeInfo: DataPathTypeInfo
}

export interface ResolveTraversalTimeStandardMemberParams {
  owner: OwnerMetadata
  segment: string
  ownerCache: OwnerMetadataCache
}

export interface ResolvedTraversalStandardMember {
  name: string
  internalName: string
  yamlName: string
  typeInfo: DataPathTypeInfo
  tableSource?: {
    table: DataPathTableInfo
    columns: Map<string, FormDataPathColumnSource>
    hasColumns: boolean
  }
}

export interface StandardMemberError {
  kind: "error"
  message: string
}

export interface ResolveStandardTableColumnParams {
  owner: OwnerMetadata
  table: DataPathTableInfo
  segment: string
}

const membersByOwnerKind = new Map<string, StandardMemberDeclaration[]>()

export function registerStandardMembers(ownerKind: string, members: readonly StandardMemberDeclaration[]): void {
  const existing = membersByOwnerKind.get(ownerKind) ?? []
  membersByOwnerKind.set(ownerKind, [...existing, ...members])
}

export function getStandardMembers(ownerKind: string): readonly StandardMemberDeclaration[] {
  return membersByOwnerKind.get(ownerKind) ?? []
}

export function clearStandardMembersForTests(): void {
  membersByOwnerKind.clear()
}

export function snapshotStandardMembersForTests(): Map<string, StandardMemberDeclaration[]> {
  return new Map([...membersByOwnerKind].map(([kind, members]) => [kind, [...members]]))
}

export function restoreStandardMembersForTests(snapshot: Map<string, StandardMemberDeclaration[]>): void {
  membersByOwnerKind.clear()
  for (const [kind, members] of snapshot) membersByOwnerKind.set(kind, [...members])
}

export function resolveIndexTimeStandardMember(
  params: ResolveIndexTimeStandardMemberParams
): ResolvedStandardMember | undefined {
  for (const member of getStandardMembers(params.owner.ref.kind)) {
    if (member.phase !== "index-time") continue
    if (member.memberKind !== "standardAttribute") continue
    if (!matchesStandardMember(member, params.internalName, params.yamlName)) continue
    if (params.explicitTypeInfo !== undefined) {
      return { name: member.names.yaml, targetName: member.names.internal, typeInfo: params.explicitTypeInfo }
    }

    const typeInfo = indexTimeTypeInfo(member, params.owner)
    if (typeInfo !== undefined) {
      return { name: member.names.yaml, targetName: member.names.internal, typeInfo }
    }
  }
  return undefined
}

export function resolveTraversalTimeStandardMember(
  params: ResolveTraversalTimeStandardMemberParams
): ResolvedTraversalStandardMember | StandardMemberError | undefined {
  for (const member of getStandardMembers(params.owner.ref.kind)) {
    if (member.phase !== "traversal-time") continue
    if (!matchesSegment(member, params.segment)) continue

    if (member.memberKind === "standardTabularSection" && member.family === "standardTable") {
      const table = { kind: member.tableKind } satisfies DataPathTableInfo
      return {
        name: member.names.yaml,
        internalName: member.names.internal,
        yamlName: member.names.yaml,
        typeInfo: {
          kinds: ["tableSource"],
          nextTypes: [],
          table,
          sourceText: `${params.owner.ref.kind}.${member.names.internal}`,
        },
        tableSource: {
          table,
          columns: columnsFromStandardTable({ owner: params.owner, table: member }),
          hasColumns: true,
        },
      }
    }

    if (member.memberKind !== "standardAttribute") continue
    if (member.family === "reverseLookup") return resolveReverseLookupMember({ ...params, member })
    if (member.family === "closedReverseLookup") return resolveClosedReverseLookupMember({ ...params, member })

    const typeInfo = indexTimeTypeInfo(member, params.owner)
    if (typeInfo !== undefined)
      return {
        name: member.names.yaml,
        internalName: member.names.internal,
        yamlName: member.names.yaml,
        typeInfo,
      }
  }
  return undefined
}

export function resolveStandardTableColumn(
  params: ResolveStandardTableColumnParams
): FormDataPathColumnSource | undefined {
  for (const member of getStandardMembers(params.owner.ref.kind)) {
    if (member.memberKind !== "standardTabularSection" || member.family !== "standardTable") continue
    if (!sameTable(member, params.table)) continue
    const columns = columnsFromStandardTable({ owner: params.owner, table: member })
    return columns.get(params.segment)
  }
  return undefined
}

export function standardMemberInternalToYaml(internalName: string): string | undefined {
  for (const members of membersByOwnerKind.values()) {
    const member = members.find((item) => item.names.internal === internalName)
    if (member !== undefined) return member.names.yaml
  }
  return undefined
}

export function standardMemberInternalToYamlForOwnerKind(ownerKind: string, internalName: string): string | undefined {
  const member = getStandardMembers(ownerKind).find((item) => item.names.internal === internalName)
  return member?.names.yaml
}

export function standardMemberYamlToInternal(yamlName: string): string | undefined {
  for (const members of membersByOwnerKind.values()) {
    const member = members.find((item) => item.names.yaml === yamlName)
    if (member !== undefined) return member.names.internal
  }
  return undefined
}

export function standardMemberYamlToInternalForOwnerKind(ownerKind: string, yamlName: string): string | undefined {
  const member = getStandardMembers(ownerKind).find((item) => item.names.yaml === yamlName)
  return member?.names.internal
}

function indexTimeTypeInfo(
  member: Exclude<StandardMemberDeclaration, StandardTableDeclaration>,
  owner: Pick<OwnerMetadata, "ref" | "facts" | "rule">
): DataPathTypeInfo | undefined {
  switch (member.family) {
    case "primitive":
      return primitiveTypeInfo(member.kind, `${owner.ref.kind}.${member.names.internal}`)
    case "sameOwnerObject":
      return {
        kinds: ["object"],
        nextTypes: [sameOwnerRef(owner.ref)],
        sourceText: `${owner.ref.kind}.${member.names.internal}`,
      }
    case "objectRefsFromProperty":
      return objectRefsFromProperty(owner, member.property)
    case "objectRefFromProperty":
      return objectRefFromProperty(owner, member.property)
    case "codeByProperty":
    case "numberByProperty":
      return scalarFromMetadataProperty(owner, member.property, `${owner.ref.kind}.${member.names.internal}`)
    case "standardEnum":
      return { kinds: ["scalar"], nextTypes: [], sourceText: member.name }
    case "typeDescription":
      return { kinds: ["typeDescription"], nextTypes: [], sourceText: `${owner.ref.kind}.${member.names.internal}` }
    case "opaque":
      return {
        kinds: ["unsupportedIntermediate"],
        nextTypes: [],
        sourceText: `${owner.ref.kind}.${member.names.internal}`,
      }
    case "unsupported":
      return { kinds: ["unsupportedIntermediate"], nextTypes: [], sourceText: member.reason }
    case "reverseLookup":
    case "closedReverseLookup":
      return undefined
  }
}

function resolveReverseLookupMember(params: {
  owner: OwnerMetadata
  ownerCache: OwnerMetadataCache
  member: ReverseLookupStandardMemberDeclaration
}): ResolvedTraversalStandardMember | StandardMemberError {
  const candidates = reverseLookupCandidates({
    owner: params.owner,
    ownerCache: params.ownerCache,
    target: params.member.target,
    property: params.member.property,
  })

  if (candidates.length === 0) return missingLinkedObjects(params.member)
  return {
    name: params.member.names.yaml,
    internalName: params.member.names.internal,
    yamlName: params.member.names.yaml,
    typeInfo: {
      kinds: ["object"],
      nextTypes: candidates,
      ...(candidates.length > 1 ? { isComposite: true } : {}),
      sourceText: candidates.map(formatOwnerRef).join(" | "),
    },
  }
}

function resolveClosedReverseLookupMember(params: {
  owner: OwnerMetadata
  ownerCache: OwnerMetadataCache
  member: ClosedReverseLookupStandardMemberDeclaration
}): ResolvedTraversalStandardMember | StandardMemberError {
  if (params.member.property !== undefined) {
    const candidates = reverseLookupCandidates({
      owner: params.owner,
      ownerCache: params.ownerCache,
      target: params.member.target ?? params.member.result,
      property: params.member.property,
    })
    if (candidates.length === 0) return missingLinkedObjects(params.member)
  }

  return {
    name: params.member.names.yaml,
    internalName: params.member.names.internal,
    yamlName: params.member.names.yaml,
    typeInfo: {
      kinds: ["unsupportedIntermediate"],
      nextTypes: [],
      sourceText: params.member.result,
    },
  }
}

function missingLinkedObjects(
  member: ReverseLookupStandardMemberDeclaration | ClosedReverseLookupStandardMemberDeclaration
): StandardMemberError {
  return {
    kind: "error",
    message: `для стандартного реквизита "${member.names.internal}" не найдены связанные объекты`,
  }
}

function reverseLookupCandidates(params: {
  owner: OwnerMetadata
  ownerCache: OwnerMetadataCache
  target: string
  property: string
}): OwnerTypeRef[] {
  const currentLink = metadataLinkForOwnerRef(params.owner.ref)
  if (currentLink === undefined) return []

  const targetKind = ownerKindFromDeclarationTarget(params.target)
  if (targetKind === undefined) return []

  const result: OwnerTypeRef[] = []
  for (const ref of params.ownerCache.listRefs(targetKind)) {
    const ownerResult = params.ownerCache.get(ref)
    if (ownerResult.status !== "ok") continue

    const links = metadataLinksFromProperty(metadataRecord(ownerResult.owner.facts)[params.property])
    if (links.some((link) => link === currentLink)) result.push(ref)
  }
  return result
}

function metadataLinksFromProperty(value: unknown): string[] {
  if (typeof value === "string") return [value]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function columnsFromStandardTable(params: {
  owner: OwnerMetadata
  table: StandardTableDeclaration
}): Map<string, FormDataPathColumnSource> {
  const columns = new Map<string, FormDataPathColumnSource>()
  for (const column of params.table.columns) {
    if ("discoveredFrom" in column && column.discoveredFrom !== undefined) {
      for (const name of discoveredColumnNames(params.owner.facts, column.discoveredFrom)) {
        columns.set(name, {
          name,
          typeInfo: primitiveTypeInfo(column.kind, `${params.owner.ref.kind}.${params.table.names.internal}.${name}`),
        })
      }
      continue
    }

    const typeInfo = standardTableColumnTypeInfo({ owner: params.owner, table: params.table, column })
    columns.set(column.names.internal, { name: column.names.internal, typeInfo })
    if (column.names.yaml !== column.names.internal)
      columns.set(column.names.yaml, { name: column.names.yaml, typeInfo })
  }
  return columns
}

function standardTableColumnTypeInfo(params: {
  owner: OwnerMetadata
  table: StandardTableDeclaration
  column: StandardTableColumnDeclaration
}): DataPathTypeInfo {
  switch (params.column.family) {
    case "primitive":
      return primitiveTypeInfo(
        params.column.kind,
        `${params.owner.ref.kind}.${params.table.names.internal}.${params.column.names.internal}`
      )
    case "sameOwnerObject":
      return {
        kinds: ["object"],
        nextTypes: [sameOwnerRef(params.owner.ref)],
        sourceText: `${params.owner.ref.kind}.${params.table.names.internal}.${params.column.names.internal}`,
      }
    case "objectRefFromOwnerProperty":
      return (
        objectRefFromProperty(params.owner, params.column.property) ?? {
          kinds: ["unknown"],
          nextTypes: [],
          sourceText: `${params.owner.ref.kind}.${params.column.property}`,
        }
      )
  }
}

function discoveredColumnNames(facts: unknown, property: string): string[] {
  const values = metadataRecord(facts)[property]
  if (!Array.isArray(values)) return []
  return values
    .map((value) => metadataRecord(value).name)
    .filter((name): name is string => typeof name === "string" && name.length > 0)
}

function sameTable(member: StandardTableDeclaration, table: DataPathTableInfo): boolean {
  return table.kind === member.tableKind
}

function matchesStandardMember(
  member: { names: StandardMemberNames },
  internalName: string,
  yamlName: string
): boolean {
  return member.names.internal === internalName || member.names.yaml === yamlName
}

function matchesSegment(member: { names: StandardMemberNames }, segment: string): boolean {
  return member.names.internal === segment || member.names.yaml === segment
}

function primitiveTypeInfo(kind: PrimitiveKind, sourceText: string): DataPathTypeInfo {
  const dataPathKind = kind === "string" || kind === "number" ? "scalar" : kind
  return { kinds: [dataPathKind], nextTypes: [], sourceText }
}

function objectRefsFromProperty(owner: Pick<OwnerMetadata, "facts">, property: string): DataPathTypeInfo | undefined {
  const links = metadataRecord(owner.facts)[property]
  if (!Array.isArray(links)) return undefined
  const nextTypes = links
    .flatMap((link) => (typeof link === "string" ? [ownerTypeRefFromMetadataLink(link)] : []))
    .filter((item): item is OwnerTypeRef => item !== undefined)
  if (nextTypes.length === 0) return undefined
  return {
    kinds: ["object"],
    nextTypes: uniqueOwnerRefs(nextTypes),
    ...(nextTypes.length > 1 ? { isComposite: true } : {}),
    sourceText: links.filter((link): link is string => typeof link === "string").join(" | "),
  }
}

function objectRefFromProperty(owner: Pick<OwnerMetadata, "facts">, property: string): DataPathTypeInfo | undefined {
  const value = metadataRecord(owner.facts)[property]
  if (typeof value !== "string") return undefined
  const ref = ownerTypeRefFromMetadataLink(value)
  if (ref === undefined) return undefined
  return { kinds: ["object"], nextTypes: [ref], sourceText: value }
}

function scalarFromMetadataProperty(
  owner: Pick<OwnerMetadata, "facts">,
  property: string,
  sourceText: string
): DataPathTypeInfo | undefined {
  return metadataRecord(owner.facts)[property] === undefined
    ? undefined
    : { kinds: ["scalar"], nextTypes: [], sourceText }
}

function ownerTypeRefFromMetadataLink(link: string): OwnerTypeRef | undefined {
  const [prefix, name] = splitMetadataLink(link)
  const kind = getOwnerKindByMetadataLinkPrefix(prefix)
  if (kind === undefined) return undefined
  return { kind, ...(name !== undefined && name !== "" ? { name } : {}) }
}

function metadataLinkForOwnerRef(ref: OwnerTypeRef): string | undefined {
  const prefix = getMetadataLinkPrefixesByOwnerKind(ref.kind)[0]
  if (prefix === undefined || ref.name === undefined) return undefined
  return `${prefix}.${ref.name}`
}

function ownerKindFromDeclarationTarget(target: string): string | undefined {
  return getOwnerKindByMetadataLinkPrefix(target) ?? target
}

function splitMetadataLink(link: string): [prefix: string, name?: string] {
  const dotIndex = link.indexOf(".")
  if (dotIndex === -1) return [link]
  return [link.substring(0, dotIndex), link.substring(dotIndex + 1)]
}

function sameOwnerRef(ref: OwnerTypeRef): OwnerTypeRef {
  return { kind: ref.kind, ...(ref.name !== undefined ? { name: ref.name } : {}) }
}

function uniqueOwnerRefs(items: readonly OwnerTypeRef[]): OwnerTypeRef[] {
  const result: OwnerTypeRef[] = []
  for (const item of items) {
    if (!result.some((existing) => existing.kind === item.kind && existing.name === item.name)) result.push(item)
  }
  return result
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function formatOwnerRef(ref: OwnerTypeRef): string {
  return ref.name === undefined ? ref.kind : `${ref.kind}.${ref.name}`
}

export type { MetadataItemRule }
