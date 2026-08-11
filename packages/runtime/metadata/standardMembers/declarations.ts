import { currentDataPathRegistrySet } from "../validation/dataPath/dataPathExecutionContext"

export type StandardMemberKind = "standardAttribute" | "standardTabularSection" | "standardTabularSectionColumn"
export type StandardMemberPhase = "index-time" | "traversal-time" | "deferred"
export type StandardMemberSourceScope = "self" | "ownerModel" | "rules" | "projectIndex"
export type PrimitiveKind = "boolean" | "string" | "dateTime" | "number"

interface ContextualStandardMemberRegistry {
  getStandardMembers(ownerKind: string): readonly StandardMemberDeclaration[]
  standardMemberInternalToYaml(internalName: string): string | undefined
  standardMemberYamlToInternalForOwnerKind(ownerKind: string, yamlName: string): string | undefined
  getStandardMemberNamePairs(): readonly StandardMemberNames[]
}

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

type StandardAttributeDeclaration = Extract<StandardMemberDeclaration, { memberKind: "standardAttribute" }>
type SelfIndexStandardAttributeParams = StandardAttributeDeclaration extends infer Declaration
  ? Declaration extends StandardAttributeDeclaration
    ? Omit<Declaration, "memberKind" | "phase" | "sourceScope">
    : never
  : never

export function selfIndexStandardAttribute<const Params extends SelfIndexStandardAttributeParams>(
  params: Params,
): Params & {
  readonly memberKind: "standardAttribute"
  readonly phase: "index-time"
  readonly sourceScope: "self"
} {
  return {
    memberKind: "standardAttribute",
    phase: "index-time",
    sourceScope: "self",
    ...params,
  }
}

export function getStandardMembers(ownerKind: string): readonly StandardMemberDeclaration[] {
  return currentDataPathRegistrySet<ContextualStandardMemberRegistry>()?.getStandardMembers(ownerKind) ?? []
}

export function standardMemberNamePairs(): readonly StandardMemberNames[] {
  return currentDataPathRegistrySet<ContextualStandardMemberRegistry>()?.getStandardMemberNamePairs() ?? []
}

export function standardMemberInternalToYaml(internalName: string): string | undefined {
  return currentDataPathRegistrySet<ContextualStandardMemberRegistry>()?.standardMemberInternalToYaml(internalName)
}

export function standardMemberInternalToYamlForOwnerKind(ownerKind: string, internalName: string): string | undefined {
  return getStandardMembers(ownerKind).find((item) => item.names.internal === internalName)?.names.yaml
}

export function standardMemberYamlToInternal(yamlName: string): string | undefined {
  return standardMemberNamePairs().find((names) => names.yaml === yamlName)?.internal
}

export function standardMemberYamlToInternalForOwnerKind(ownerKind: string, yamlName: string): string | undefined {
  return currentDataPathRegistrySet<ContextualStandardMemberRegistry>()
    ?.standardMemberYamlToInternalForOwnerKind(ownerKind, yamlName)
}
