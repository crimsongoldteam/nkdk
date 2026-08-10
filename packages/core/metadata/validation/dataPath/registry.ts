import type { FormDataPathIndex } from "../../ruleRuntime/dataPath/formIndex"
import type { ObjectField, OwnerMetadata, OwnerMetadataCache } from "./contracts"
import type { DataPathTableInfo, DataPathTypeInfo, FormDataPathColumnSource, OwnerTypeRef } from "./types"
import {
  commonStandardMemberFillValuePolicy,
  clearStandardMembersForTests,
  registerStandardMembers,
  restoreStandardMembersForTests,
  snapshotStandardMembersForTests,
  type StandardMemberDeclaration as SnapshotStandardMemberDeclaration,
} from "../../standardMembers/declarations"
import type { StandardMemberDeclaration } from "../../standardMembers/declarations"
import {
  clearOwnerKindRegistryForTests,
  getDataPathOwnerKind,
  getDataPathOwnerKindByItemType,
  getMetadataLinkPrefixesByOwnerKind,
  getOwnerKindByMetadataLinkPrefix,
  getOwnerKindByRegisterRecordSetBase,
  getOwnerKindByTypeDescriptionBase,
  registerDataPathOwnerKind,
  restoreOwnerKindRegistryForTests,
  snapshotOwnerKindRegistryForTests,
  type OwnerKindRegistrySnapshot,
} from "./ownerKindRegistry"
export {
  getDataPathOwnerKind,
  getDataPathOwnerKindByItemType,
  getMetadataLinkPrefixesByOwnerKind,
  getOwnerKindByMetadataLinkPrefix,
  getOwnerKindByRegisterRecordSetBase,
  getOwnerKindByTypeDescriptionBase,
  registerDataPathOwnerKind,
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
  | { readonly kind: "standardMembers"; readonly ownerKind: string; readonly members: readonly StandardMemberDeclaration[] }

export type DataPathContribution = DataPathRegistrationContribution | {
  readonly kind: "provider"
  readonly create: (ownerKinds: DataPathOwnerKindLookup) => readonly DataPathRegistrationContribution[]
}

export interface DataPathRegistrySet {
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
  getStandardMembers(ownerKind: string): readonly StandardMemberDeclaration[]
  standardMemberInternalToYaml(internalName: string): string | undefined
  standardMemberYamlToInternalForOwnerKind(ownerKind: string, yamlName: string): string | undefined
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
    else {
      const normalized = contribution.members.map((member) => {
        if (member.memberKind !== "standardAttribute" || member.fillValue !== undefined) return member
        const fillValue = commonStandardMemberFillValuePolicy(member.names.internal)
        return fillValue === undefined ? member : { ...member, fillValue }
      })
      standardMembers.set(contribution.ownerKind, [...(standardMembers.get(contribution.ownerKind) ?? []), ...normalized])
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
  }
}

export function applyLegacyDataPathContributions(contributions: readonly DataPathContribution[]): void {
  const lookup: DataPathOwnerKindLookup = {
    get: getDataPathOwnerKind,
    getByItemType: getDataPathOwnerKindByItemType,
    getByTypeDescriptionBase: getOwnerKindByTypeDescriptionBase,
    getByRegisterRecordSetBase: getOwnerKindByRegisterRecordSetBase,
    getByMetadataLinkPrefix: getOwnerKindByMetadataLinkPrefix,
    getMetadataLinkPrefixes: getMetadataLinkPrefixesByOwnerKind,
  }
  const registrations = contributions.flatMap((contribution) =>
    contribution.kind === "provider" ? contribution.create(lookup) : [contribution],
  )
  for (const contribution of registrations) {
    if (contribution.kind === "ownerKind") registerDataPathOwnerKind(contribution.registration)
    else if (contribution.kind === "typeResolver") registerDataPathTypeResolver(contribution.resolver)
    else if (contribution.kind === "objectFieldCollections") registerObjectFieldCollectionProvider(contribution.provider)
    else if (contribution.kind === "standardAttributeType") registerStandardAttributeTypeResolver(contribution.resolver)
    else if (contribution.kind === "virtualOwnerField") registerVirtualOwnerFieldResolver(contribution.resolver)
    else if (contribution.kind === "tableColumn") registerTableColumnResolver(contribution.resolver)
    else if (contribution.kind === "traversalTransition") registerTraversalTransitionResolver(contribution.resolver)
    else if (contribution.kind === "opaqueTraversal") registerOpaqueTraversalResolver(contribution.resolver)
    else if (contribution.kind === "registerRecordsItem") registerRegisterRecordsItemResolver(contribution.resolver)
    else registerStandardMembers(contribution.ownerKind, contribution.members)
  }
}

const typeResolvers: DataPathTypeResolver[] = []
const objectFieldCollectionProviders: ObjectFieldCollectionProvider[] = []
const standardAttributeTypeResolvers: StandardAttributeTypeResolver[] = []
const virtualOwnerFieldResolvers: VirtualOwnerFieldResolver[] = []
const tableColumnResolvers: TableColumnResolver[] = []
const traversalTransitionResolvers: TraversalTransitionResolver[] = []
const opaqueTraversalResolvers: OpaqueTraversalResolver[] = []
const registerRecordsItemResolvers: RegisterRecordsItemResolver[] = []

export interface DataPathResolverRegistrySnapshot {
  ownerKinds: OwnerKindRegistrySnapshot
  typeResolvers: DataPathTypeResolver[]
  objectFieldCollectionProviders: ObjectFieldCollectionProvider[]
  standardAttributeTypeResolvers: StandardAttributeTypeResolver[]
  virtualOwnerFieldResolvers: VirtualOwnerFieldResolver[]
  tableColumnResolvers: TableColumnResolver[]
  traversalTransitionResolvers: TraversalTransitionResolver[]
  opaqueTraversalResolvers: OpaqueTraversalResolver[]
  registerRecordsItemResolvers: RegisterRecordsItemResolver[]
  standardMembers: Map<string, SnapshotStandardMemberDeclaration[]>
}

export function registerDataPathTypeResolver(resolver: DataPathTypeResolver): void {
  typeResolvers.push(resolver)
}

export function resolveRegisteredDataPathType(params: {
  baseType: string
  name?: string
}): DataPathTypeInfo | undefined {
  for (const resolver of typeResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerObjectFieldCollectionProvider(provider: ObjectFieldCollectionProvider): void {
  objectFieldCollectionProviders.push(provider)
}

export function getObjectFieldCollectionDescriptors(owner: OwnerMetadata): readonly ObjectFieldCollectionDescriptor[] {
  return objectFieldCollectionProviders.flatMap((provider) => [...provider({ owner })])
}

export function registerStandardAttributeTypeResolver(resolver: StandardAttributeTypeResolver): void {
  standardAttributeTypeResolvers.push(resolver)
}

export function resolveStandardAttributeType(
  params: Parameters<StandardAttributeTypeResolver>[0]
): DataPathTypeInfo | undefined {
  for (const resolver of standardAttributeTypeResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerVirtualOwnerFieldResolver(resolver: VirtualOwnerFieldResolver): void {
  virtualOwnerFieldResolvers.push(resolver)
}

export function resolveVirtualOwnerField(
  params: Parameters<VirtualOwnerFieldResolver>[0]
): ReturnType<VirtualOwnerFieldResolver> {
  for (const resolver of virtualOwnerFieldResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerTableColumnResolver(resolver: TableColumnResolver): void {
  tableColumnResolvers.push(resolver)
}

export function resolveRegisteredTableColumn(
  params: Parameters<TableColumnResolver>[0]
): FormDataPathColumnSource | undefined {
  for (const resolver of tableColumnResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerTraversalTransitionResolver(resolver: TraversalTransitionResolver): void {
  traversalTransitionResolvers.push(resolver)
}

export function resolveTraversalTransition(
  params: Parameters<TraversalTransitionResolver>[0]
): ReturnType<TraversalTransitionResolver> {
  for (const resolver of traversalTransitionResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerOpaqueTraversalResolver(resolver: OpaqueTraversalResolver): void {
  opaqueTraversalResolvers.push(resolver)
}

export function isOpaqueTraversal(params: Parameters<OpaqueTraversalResolver>[0]): boolean {
  return opaqueTraversalResolvers.some((resolver) => resolver(params))
}

export function registerRegisterRecordsItemResolver(resolver: RegisterRecordsItemResolver): void {
  registerRecordsItemResolvers.push(resolver)
}

export function resolveRegisterRecordsItem(
  params: Parameters<RegisterRecordsItemResolver>[0]
): ReturnType<RegisterRecordsItemResolver> {
  return resolveMovementItem(params)
}

export function resolveMovementItem(
  params: Parameters<RegisterRecordsItemResolver>[0]
): ReturnType<RegisterRecordsItemResolver> {
  for (const resolver of registerRecordsItemResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function clearDataPathResolverRegistryForTests(): void {
  clearOwnerKindRegistryForTests()
  typeResolvers.length = 0
  objectFieldCollectionProviders.length = 0
  standardAttributeTypeResolvers.length = 0
  virtualOwnerFieldResolvers.length = 0
  tableColumnResolvers.length = 0
  traversalTransitionResolvers.length = 0
  opaqueTraversalResolvers.length = 0
  registerRecordsItemResolvers.length = 0
  clearStandardMembersForTests()
}

export function snapshotDataPathResolverRegistryForTests(): DataPathResolverRegistrySnapshot {
  return {
    ownerKinds: snapshotOwnerKindRegistryForTests(),
    typeResolvers: [...typeResolvers],
    objectFieldCollectionProviders: [...objectFieldCollectionProviders],
    standardAttributeTypeResolvers: [...standardAttributeTypeResolvers],
    virtualOwnerFieldResolvers: [...virtualOwnerFieldResolvers],
    tableColumnResolvers: [...tableColumnResolvers],
    traversalTransitionResolvers: [...traversalTransitionResolvers],
    opaqueTraversalResolvers: [...opaqueTraversalResolvers],
    registerRecordsItemResolvers: [...registerRecordsItemResolvers],
    standardMembers: snapshotStandardMembersForTests(),
  }
}

export function restoreDataPathResolverRegistryForTests(snapshot: DataPathResolverRegistrySnapshot): void {
  clearDataPathResolverRegistryForTests()
  restoreOwnerKindRegistryForTests(snapshot.ownerKinds)
  typeResolvers.push(...snapshot.typeResolvers)
  objectFieldCollectionProviders.push(...snapshot.objectFieldCollectionProviders)
  standardAttributeTypeResolvers.push(...snapshot.standardAttributeTypeResolvers)
  virtualOwnerFieldResolvers.push(...snapshot.virtualOwnerFieldResolvers)
  tableColumnResolvers.push(...snapshot.tableColumnResolvers)
  traversalTransitionResolvers.push(...snapshot.traversalTransitionResolvers)
  opaqueTraversalResolvers.push(...snapshot.opaqueTraversalResolvers)
  registerRecordsItemResolvers.push(...snapshot.registerRecordsItemResolvers)
  restoreStandardMembersForTests(snapshot.standardMembers)
}

export {
  getStandardMembers,
  registerStandardMembers,
  standardMemberInternalToYaml,
  standardMemberInternalToYamlForOwnerKind,
  standardMemberNamePairs,
  standardMemberYamlToInternal,
  standardMemberYamlToInternalForOwnerKind,
  standardMembersRegistryRevision,
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
