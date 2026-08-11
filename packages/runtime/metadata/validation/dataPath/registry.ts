import type { FormDataPathIndex } from "../../ruleRuntime/dataPath/formIndex"
import type { ObjectField, OwnerMetadata, OwnerMetadataCache } from "./contracts"
import type { DataPathTableInfo, DataPathTypeInfo, FormDataPathColumnSource, OwnerTypeRef } from "./types"
import {
  commonStandardMemberFillValuePolicy,
} from "../../standardMembers/declarations"
import type { StandardMemberDeclaration } from "../../standardMembers/declarations"
import { currentDataPathRegistrySet } from "./dataPathExecutionContext"
export {
  getDataPathOwnerKind,
  getDataPathOwnerKindByItemType,
  getMetadataLinkPrefixesByOwnerKind,
  getOwnerKindByMetadataLinkPrefix,
  getOwnerKindByRegisterRecordSetBase,
  getOwnerKindByTypeDescriptionBase,
  type DataPathOwnerKindRegistration,
} from "./ownerKindRegistry"

export type DataPathTypeResolver = (params: { baseType: string; name?: string }) => DataPathTypeInfo | undefined

export interface ObjectFieldCollectionDescriptor {
  collection: string
  kind: "attribute" | "standardAttribute" | "tabularSection" | "dimension" | "resource" | "addressingAttribute"
}

export type ObjectFieldCollectionProvider = (params: {
  owner: OwnerMetadata
}) => readonly ObjectFieldCollectionDescriptor[]

export type StandardAttributeTypeResolver = (params: {
  owner: OwnerMetadata
  internalName: string
  yamlName: string
  explicitTypeInfo?: DataPathTypeInfo
}) => DataPathTypeInfo | undefined

export type VirtualOwnerFieldResolver = (params: { owner: OwnerMetadata; segment: string }) =>
  | {
      name: string
      typeInfo: DataPathTypeInfo
      tableSource?: {
        table: DataPathTableInfo
        columns: Map<string, FormDataPathColumnSource>
        hasColumns: boolean
      }
    }
  | undefined

export type TableColumnResolver = (params: {
  table: DataPathTableInfo
  segment: string
  index: FormDataPathIndex
  owner?: OwnerMetadata
  field?: ObjectField
}) => FormDataPathColumnSource | undefined

export type TraversalTransitionResolver = (params: {
  owner: OwnerMetadata
  segment: string
  ownerCache: OwnerMetadataCache
}) =>
  | {
      kind?: "state"
      typeInfo: DataPathTypeInfo
      sourceName: string
      targetName?: string
      sourceKind?: "objectField" | "registerRecords"
      tableSource?: {
        table: DataPathTableInfo
        columns: Map<string, FormDataPathColumnSource>
        hasColumns: boolean
      }
      registerRecordsOwner?: OwnerMetadata
    }
  | {
      kind: "warning"
    }
  | undefined

export type OpaqueTraversalResolver = (params: {
  owner: OwnerTypeRef
  segment: string
}) => boolean

export type RegisterRecordsItemResolver = (params: { owner: OwnerMetadata; segment: string }) =>
  | {
      owner: OwnerTypeRef
      typeInfo: DataPathTypeInfo
      tableSource: {
        table: DataPathTableInfo
        columns: Map<string, FormDataPathColumnSource>
        hasColumns: boolean
      }
    }
  | undefined

export interface DataPathElementPropertyRegistration {
  readonly itemType: string
  readonly propertyYaml: string
  readonly terminalTypes: readonly string[]
}

export interface DataPathOwnerKindLookup {
  get(kind: string): import("./ownerKindRegistry").DataPathOwnerKindRegistration | undefined
  getByItemType(itemType: string): import("./ownerKindRegistry").DataPathOwnerKindRegistration | undefined
  getByTypeDescriptionBase(baseType: string): string | undefined
  getByRegisterRecordSetBase(baseType: string): string | undefined
  getByMetadataLinkPrefix(prefix: string): string | undefined
  getMetadataLinkPrefixes(kind: string): readonly string[]
}

type DataPathRegistrationContribution =
  | { readonly kind: "ownerKind"; readonly registration: import("./ownerKindRegistry").DataPathOwnerKindRegistration }
  | { readonly kind: "typeResolver"; readonly resolver: DataPathTypeResolver }
  | { readonly kind: "objectFieldCollections"; readonly provider: ObjectFieldCollectionProvider }
  | { readonly kind: "standardAttributeType"; readonly resolver: StandardAttributeTypeResolver }
  | { readonly kind: "virtualOwnerField"; readonly resolver: VirtualOwnerFieldResolver }
  | { readonly kind: "tableColumn"; readonly resolver: TableColumnResolver }
  | { readonly kind: "traversalTransition"; readonly resolver: TraversalTransitionResolver }
  | { readonly kind: "opaqueTraversal"; readonly resolver: OpaqueTraversalResolver }
  | { readonly kind: "registerRecordsItem"; readonly resolver: RegisterRecordsItemResolver }
  | { readonly kind: "elementProperty"; readonly registration: DataPathElementPropertyRegistration }
  | {
      readonly kind: "formattingNamePairs"
      readonly pairs: readonly import("../../standardMembers/declarations").StandardMemberNames[]
    }
  | { readonly kind: "standardMembers"; readonly ownerKind: string; readonly members: readonly StandardMemberDeclaration[] }

export type DataPathContribution = DataPathRegistrationContribution | {
  readonly kind: "provider"
  readonly create: (ownerKinds: DataPathOwnerKindLookup) => readonly DataPathRegistrationContribution[]
}

export interface DataPathRegistrySet {
  registerStandardMembers(ownerKind: string, members: readonly StandardMemberDeclaration[]): void
  getOwnerKind(kind: string): import("./ownerKindRegistry").DataPathOwnerKindRegistration | undefined
  getOwnerKindByItemType(itemType: string): import("./ownerKindRegistry").DataPathOwnerKindRegistration | undefined
  getOwnerKindByTypeDescriptionBase(baseType: string): string | undefined
  getOwnerKindByRegisterRecordSetBase(baseType: string): string | undefined
  getOwnerKindByMetadataLinkPrefix(prefix: string): string | undefined
  getMetadataLinkPrefixesByOwnerKind(kind: string): readonly string[]
  resolveType(params: Parameters<DataPathTypeResolver>[0]): DataPathTypeInfo | undefined
  getObjectFieldCollections(owner: OwnerMetadata): readonly ObjectFieldCollectionDescriptor[]
  resolveStandardAttributeType(params: Parameters<StandardAttributeTypeResolver>[0]): DataPathTypeInfo | undefined
  resolveVirtualOwnerField(params: Parameters<VirtualOwnerFieldResolver>[0]): ReturnType<VirtualOwnerFieldResolver>
  resolveTableColumn(params: Parameters<TableColumnResolver>[0]): ReturnType<TableColumnResolver>
  resolveTraversalTransition(params: Parameters<TraversalTransitionResolver>[0]): ReturnType<TraversalTransitionResolver>
  isOpaqueTraversal(params: Parameters<OpaqueTraversalResolver>[0]): boolean
  resolveRegisterRecordsItem(params: Parameters<RegisterRecordsItemResolver>[0]): ReturnType<RegisterRecordsItemResolver>
  getElementPropertyTerminalTypes(itemType: string, propertyYaml: string): readonly string[] | undefined
  getStandardMembers(ownerKind: string): readonly StandardMemberDeclaration[]
  standardMemberInternalToYaml(internalName: string): string | undefined
  standardMemberYamlToInternalForOwnerKind(ownerKind: string, yamlName: string): string | undefined
  getStandardMemberNamePairs(): readonly import("../../standardMembers/declarations").StandardMemberNames[]
}

export function createDataPathRegistrySet(contributions: readonly DataPathContribution[]): DataPathRegistrySet {
  type OwnerKind = import("./ownerKindRegistry").DataPathOwnerKindRegistration
  const ownerKinds = new Map<string, OwnerKind>()
  const ownerKindsByTypeBase = new Map<string, string>()
  const ownerKindsByRecordSetBase = new Map<string, string>()
  const ownerKindsByLinkPrefix = new Map<string, string>()
  const resolvers = {
    type: [] as DataPathTypeResolver[],
    fields: [] as ObjectFieldCollectionProvider[],
    standardAttribute: [] as StandardAttributeTypeResolver[],
    virtualField: [] as VirtualOwnerFieldResolver[],
    tableColumn: [] as TableColumnResolver[],
    traversal: [] as TraversalTransitionResolver[],
    opaque: [] as OpaqueTraversalResolver[],
    registerRecords: [] as RegisterRecordsItemResolver[],
  }
  const standardMembers = new Map<string, StandardMemberDeclaration[]>()
  const formattingNamePairs: import("../../standardMembers/declarations").StandardMemberNames[] = []
  const elementProperties = new Map<string, readonly string[]>()
  const addStandardMembers = (ownerKind: string, members: readonly StandardMemberDeclaration[]) => {
    const normalized = members.map((member) => {
      if (member.memberKind !== "standardAttribute" || member.fillValue !== undefined) return member
      const fillValue = commonStandardMemberFillValuePolicy(member.names.internal)
      return fillValue === undefined ? member : { ...member, fillValue }
    })
    standardMembers.set(ownerKind, [...(standardMembers.get(ownerKind) ?? []), ...normalized])
  }
  const ownerKindLookup: DataPathOwnerKindLookup = {
    get: (kind) => ownerKinds.get(kind),
    getByItemType: (itemType) => [...new Set(ownerKinds.values())].find(({ rule }) => rule.itemType === itemType),
    getByTypeDescriptionBase: (baseType) => ownerKindsByTypeBase.get(baseType),
    getByRegisterRecordSetBase: (baseType) => ownerKindsByRecordSetBase.get(baseType),
    getByMetadataLinkPrefix: (prefix) => ownerKindsByLinkPrefix.get(prefix),
    getMetadataLinkPrefixes: (kind) => ownerKinds.get(kind)?.metadataLinkPrefixes ?? [],
  }

  const registrations = contributions.flatMap((contribution) =>
    contribution.kind === "provider" ? contribution.create(ownerKindLookup) : [contribution],
  )
  for (const contribution of registrations) {
    if (contribution.kind === "ownerKind") {
      const registration = contribution.registration
      ownerKinds.set(registration.kind, registration)
      for (const alias of registration.aliases ?? []) ownerKinds.set(alias, registration)
      for (const base of registration.typeDescriptionBases ?? []) ownerKindsByTypeBase.set(base, registration.kind)
      for (const base of registration.registerRecordSetBases ?? []) ownerKindsByRecordSetBase.set(base, registration.kind)
      for (const prefix of registration.metadataLinkPrefixes ?? []) {
        if (!ownerKindsByLinkPrefix.has(prefix)) ownerKindsByLinkPrefix.set(prefix, registration.kind)
      }
    } else if (contribution.kind === "typeResolver") resolvers.type.push(contribution.resolver)
    else if (contribution.kind === "objectFieldCollections") resolvers.fields.push(contribution.provider)
    else if (contribution.kind === "standardAttributeType") resolvers.standardAttribute.push(contribution.resolver)
    else if (contribution.kind === "virtualOwnerField") resolvers.virtualField.push(contribution.resolver)
    else if (contribution.kind === "tableColumn") resolvers.tableColumn.push(contribution.resolver)
    else if (contribution.kind === "traversalTransition") resolvers.traversal.push(contribution.resolver)
    else if (contribution.kind === "opaqueTraversal") resolvers.opaque.push(contribution.resolver)
    else if (contribution.kind === "registerRecordsItem") resolvers.registerRecords.push(contribution.resolver)
    else if (contribution.kind === "elementProperty") {
      const registration = contribution.registration
      elementProperties.set(`${registration.itemType}\u0000${registration.propertyYaml}`, registration.terminalTypes)
    }
    else if (contribution.kind === "formattingNamePairs") formattingNamePairs.push(...contribution.pairs)
    else {
      addStandardMembers(contribution.ownerKind, contribution.members)
    }
  }

  const first = <Resolver extends (params: never) => unknown>(items: readonly Resolver[], params: Parameters<Resolver>[0]) => {
    for (const resolver of items) {
      const result = resolver(params)
      if (result !== undefined) return result as ReturnType<Resolver>
    }
    return undefined
  }
  return {
    registerStandardMembers(ownerKind, members) {
      addStandardMembers(ownerKind, members)
    },
    getOwnerKind: (kind) => ownerKinds.get(kind),
    getOwnerKindByItemType: (itemType) => [...new Set(ownerKinds.values())].find(({ rule }) => rule.itemType === itemType),
    getOwnerKindByTypeDescriptionBase: (baseType) => ownerKindsByTypeBase.get(baseType),
    getOwnerKindByRegisterRecordSetBase: (baseType) => ownerKindsByRecordSetBase.get(baseType),
    getOwnerKindByMetadataLinkPrefix: (prefix) => ownerKindsByLinkPrefix.get(prefix),
    getMetadataLinkPrefixesByOwnerKind: (kind) => ownerKinds.get(kind)?.metadataLinkPrefixes ?? [],
    resolveType: (params) => first(resolvers.type, params),
    getObjectFieldCollections: (owner) => resolvers.fields.flatMap((provider) => [...provider({ owner })]),
    resolveStandardAttributeType: (params) => first(resolvers.standardAttribute, params),
    resolveVirtualOwnerField: (params) => first(resolvers.virtualField, params),
    resolveTableColumn: (params) => first(resolvers.tableColumn, params),
    resolveTraversalTransition: (params) => first(resolvers.traversal, params),
    isOpaqueTraversal: (params) => resolvers.opaque.some((resolver) => resolver(params)),
    resolveRegisterRecordsItem: (params) => first(resolvers.registerRecords, params),
    getElementPropertyTerminalTypes: (itemType, propertyYaml) =>
      elementProperties.get(`${itemType}\u0000${propertyYaml}`),
    getStandardMembers: (ownerKind) => standardMembers.get(ownerKind) ?? [],
    standardMemberInternalToYaml: (internalName) => {
      for (const members of standardMembers.values()) {
        const member = members.find(({ names }) => names.internal === internalName)
        if (member !== undefined) return member.names.yaml
      }
      return undefined
    },
    standardMemberYamlToInternalForOwnerKind: (ownerKind, yamlName) =>
      standardMembers.get(ownerKind)?.find(({ names }) => names.yaml === yamlName)?.names.internal,
    getStandardMemberNamePairs: () => {
      const pairs = new Map<string, import("../../standardMembers/declarations").StandardMemberNames>()
      for (const names of formattingNamePairs) pairs.set(`${names.internal}\u0000${names.yaml}`, names)
      for (const members of standardMembers.values()) {
        for (const member of members) {
          pairs.set(`${member.names.internal}\u0000${member.names.yaml}`, member.names)
          if (member.memberKind === "standardTabularSection") {
            for (const column of member.columns) {
              pairs.set(`${column.names.internal}\u0000${column.names.yaml}`, column.names)
            }
          }
        }
      }
      return [...pairs.values()]
    },
  }
}

export function resolveRegisteredDataPathType(params: {
  baseType: string
  name?: string
}): DataPathTypeInfo | undefined {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.resolveType(params)
}

export function getObjectFieldCollectionDescriptors(owner: OwnerMetadata): readonly ObjectFieldCollectionDescriptor[] {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.getObjectFieldCollections(owner) ?? []
}

export function resolveStandardAttributeType(
  params: Parameters<StandardAttributeTypeResolver>[0]
): DataPathTypeInfo | undefined {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.resolveStandardAttributeType(params)
}

export function resolveVirtualOwnerField(
  params: Parameters<VirtualOwnerFieldResolver>[0]
): ReturnType<VirtualOwnerFieldResolver> {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.resolveVirtualOwnerField(params)
}

export function resolveRegisteredTableColumn(
  params: Parameters<TableColumnResolver>[0]
): FormDataPathColumnSource | undefined {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.resolveTableColumn(params)
}

export function resolveTraversalTransition(
  params: Parameters<TraversalTransitionResolver>[0]
): ReturnType<TraversalTransitionResolver> {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.resolveTraversalTransition(params)
}

export function isOpaqueTraversal(params: Parameters<OpaqueTraversalResolver>[0]): boolean {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.isOpaqueTraversal(params) ?? false
}

export function resolveRegisterRecordsItem(
  params: Parameters<RegisterRecordsItemResolver>[0]
): ReturnType<RegisterRecordsItemResolver> {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.resolveRegisterRecordsItem(params)
}

export function resolveMovementItem(
  params: Parameters<RegisterRecordsItemResolver>[0]
): ReturnType<RegisterRecordsItemResolver> {
  return currentDataPathRegistrySet<DataPathRegistrySet>()?.resolveRegisterRecordsItem(params)
}

export function getDataPathElementPropertyTerminalTypes(
  itemType: string,
  propertyYaml: string,
): readonly string[] | undefined {
  return currentDataPathRegistrySet<DataPathRegistrySet>()
    ?.getElementPropertyTerminalTypes(itemType, propertyYaml)
}

export {
  getStandardMembers,
  standardMemberInternalToYamlForOwnerKind,
  standardMemberNamePairs,
  standardMemberYamlToInternalForOwnerKind,
} from "../../standardMembers/declarations"
export {
  resolveIndexTimeStandardMember,
  resolveStandardTableColumn,
  resolveTraversalTimeStandardMember,
} from "./standardMembers"
export type {
  PrimitiveKind,
  StandardMemberDeclaration,
  StandardMemberFillValuePolicy,
  StandardMemberKind,
  StandardMemberNames,
  StandardMemberPhase,
  StandardMemberSourceScope,
} from "../../standardMembers/declarations"
export type {
  StandardMemberError,
} from "./standardMembers"
