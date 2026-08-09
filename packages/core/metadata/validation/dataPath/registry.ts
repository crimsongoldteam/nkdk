import type { FormDataPathIndex } from "../../ruleRuntime/dataPath/formIndex"
import type { ObjectField, OwnerMetadata, OwnerMetadataCache } from "./contracts"
import type { DataPathTableInfo, DataPathTypeInfo, FormDataPathColumnSource, OwnerTypeRef } from "./types"
import {
  clearStandardMembersForTests,
  restoreStandardMembersForTests,
  snapshotStandardMembersForTests,
  type StandardMemberDeclaration as SnapshotStandardMemberDeclaration,
} from "../../standardMembers/declarations"
import {
  clearOwnerKindRegistryForTests,
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
