import {
  clearStandardMemberAliasesForTests,
  registerStandardMemberAlias,
} from "@nkdk/runtime/rule-kit"

export type StandardMemberKind = "standardAttribute" | "standardTabularSection" | "standardTabularSectionColumn"
export type StandardMemberPhase = "index-time" | "traversal-time" | "deferred"
export type StandardMemberSourceScope = "self" | "ownerModel" | "rules" | "projectIndex"
export type PrimitiveKind = "boolean" | "string" | "dateTime" | "number"

export type StandardMemberFillValuePolicy =
  | { readonly policy: "forbidden" }
  | { readonly policy: "byEffectiveType"; readonly implicitValue?: string | number | boolean }
  | {
      readonly policy: "codeFromOwner"
      readonly typeProperty: string
      readonly lengthProperty: string
      readonly allowedLengthProperty: string
    }
  | {
      readonly policy: "ownerReference"
      readonly ownersProperty: string
      readonly predefinedOnly: true
      readonly allowUnselectedTypeWhenComposite: true
    }
  | { readonly policy: "notSpecified" }

const commonStandardAttributeFillValuePolicies: Readonly<Record<string, StandardMemberFillValuePolicy | undefined>> = {
  Ref: { policy: "forbidden" },
  IsFolder: { policy: "forbidden" },
  Predefined: { policy: "forbidden" },
  PredefinedDataName: { policy: "forbidden" },
  DeletionMark: { policy: "byEffectiveType", implicitValue: false },
}

export function commonStandardMemberFillValuePolicy(
  internalName: string
): StandardMemberFillValuePolicy | undefined {
  return commonStandardAttributeFillValuePolicies[internalName]
}

export interface StandardMemberNames {
  internal: string
  yaml: string
}

interface BaseStandardMemberDeclaration {
  memberKind: StandardMemberKind
  names: StandardMemberNames
  phase: StandardMemberPhase
  sourceScope: StandardMemberSourceScope
  fillValue?: StandardMemberFillValuePolicy
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

const membersByOwnerKind = new Map<string, StandardMemberDeclaration[]>()
let standardMembersRevision = 0

export function registerStandardMembers(ownerKind: string, members: readonly StandardMemberDeclaration[]): void {
  const existing = membersByOwnerKind.get(ownerKind) ?? []
  const registered = members.map(withCommonFillValuePolicy)
  membersByOwnerKind.set(ownerKind, [...existing, ...registered])
  registerMetadataTargetAliases(registered)
  standardMembersRevision += 1
}

function withCommonFillValuePolicy(member: StandardMemberDeclaration): StandardMemberDeclaration {
  if (member.memberKind !== "standardAttribute" || member.fillValue !== undefined) return member
  const fillValue = commonStandardAttributeFillValuePolicies[member.names.internal]
  return fillValue === undefined ? member : { ...member, fillValue }
}

export function getStandardMembers(ownerKind: string): readonly StandardMemberDeclaration[] {
  return membersByOwnerKind.get(ownerKind) ?? []
}

export function clearStandardMembersForTests(): void {
  membersByOwnerKind.clear()
  clearStandardMemberAliasesForTests()
  standardMembersRevision += 1
}

export function snapshotStandardMembersForTests(): Map<string, StandardMemberDeclaration[]> {
  return new Map([...membersByOwnerKind].map(([kind, members]) => [kind, [...members]]))
}

export function restoreStandardMembersForTests(snapshot: Map<string, StandardMemberDeclaration[]>): void {
  membersByOwnerKind.clear()
  clearStandardMemberAliasesForTests()
  for (const [kind, members] of snapshot) {
    membersByOwnerKind.set(kind, [...members])
    registerMetadataTargetAliases(members)
  }
  standardMembersRevision += 1
}

function registerMetadataTargetAliases(members: readonly StandardMemberDeclaration[]): void {
  for (const member of members) {
    registerStandardMemberAlias(member.names.yaml, member.names.internal)
    if (member.memberKind !== "standardTabularSection") continue
    for (const column of member.columns) {
      registerStandardMemberAlias(column.names.yaml, column.names.internal)
    }
  }
}

export function standardMemberNamePairs(): readonly StandardMemberNames[] {
  const pairs = new Map<string, StandardMemberNames>()
  for (const members of membersByOwnerKind.values()) {
    for (const member of members) {
      addStandardMemberNamePair(pairs, member.names)
      if (member.memberKind === "standardTabularSection") {
        for (const column of member.columns) addStandardMemberNamePair(pairs, column.names)
      }
    }
  }
  return [...pairs.values()]
}

export function standardMembersRegistryRevision(): number {
  return standardMembersRevision
}

export function standardMemberInternalToYaml(internalName: string): string | undefined {
  for (const members of membersByOwnerKind.values()) {
    const member = members.find((item) => item.names.internal === internalName)
    if (member !== undefined) return member.names.yaml
  }
  return undefined
}

export function standardMemberInternalToYamlForOwnerKind(ownerKind: string, internalName: string): string | undefined {
  return getStandardMembers(ownerKind).find((item) => item.names.internal === internalName)?.names.yaml
}

export function standardMemberYamlToInternal(yamlName: string): string | undefined {
  for (const members of membersByOwnerKind.values()) {
    const member = members.find((item) => item.names.yaml === yamlName)
    if (member !== undefined) return member.names.internal
  }
  return undefined
}

export function standardMemberYamlToInternalForOwnerKind(ownerKind: string, yamlName: string): string | undefined {
  return getStandardMembers(ownerKind).find((item) => item.names.yaml === yamlName)?.names.internal
}

function addStandardMemberNamePair(pairs: Map<string, StandardMemberNames>, names: StandardMemberNames): void {
  pairs.set(`${names.internal}\u0000${names.yaml}`, names)
}
