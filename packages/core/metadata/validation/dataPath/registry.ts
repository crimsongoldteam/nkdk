import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { FormDataPathIndex } from "./formIndex"
import type { ObjectField } from "./objectFields"
import type { OwnerMetadata, OwnerMetadataCache } from "./ownerCache"
import type {
  DataPathTableInfo,
  DataPathTypeInfo,
  FormDataPathColumnSource,
  OwnerTypeRef,
} from "./types"

export interface DataPathOwnerKindRegistration {
  kind: OwnerTypeRef["kind"]
  projectDir: string
  rule: MetadataItemRule
  typeDescriptionBases?: readonly string[]
  registerRecordSetBases?: readonly string[]
  metadataLinkPrefixes?: readonly string[]
  aliases?: readonly OwnerTypeRef["kind"][]
}

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

export type VirtualOwnerFieldResolver = (params: {
  owner: OwnerMetadata
  segment: string
}) =>
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

export type RegisterRecordsItemResolver = (params: {
  owner: OwnerMetadata
  segment: string
}) =>
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

const ownerKinds = new Map<string, DataPathOwnerKindRegistration>()
const ownerKindByTypeBase = new Map<string, string>()
const ownerKindByRegisterRecordSetBase = new Map<string, string>()
const ownerKindByMetadataLinkPrefix = new Map<string, string>()
const typeResolvers: DataPathTypeResolver[] = []
const objectFieldCollectionProviders: ObjectFieldCollectionProvider[] = []
const standardAttributeTypeResolvers: StandardAttributeTypeResolver[] = []
const virtualOwnerFieldResolvers: VirtualOwnerFieldResolver[] = []
const tableColumnResolvers: TableColumnResolver[] = []
const traversalTransitionResolvers: TraversalTransitionResolver[] = []
const registerRecordsItemResolvers: RegisterRecordsItemResolver[] = []

export interface DataPathResolverRegistrySnapshot {
  ownerKinds: Map<string, DataPathOwnerKindRegistration>
  ownerKindByTypeBase: Map<string, string>
  ownerKindByRegisterRecordSetBase: Map<string, string>
  ownerKindByMetadataLinkPrefix: Map<string, string>
  typeResolvers: DataPathTypeResolver[]
  objectFieldCollectionProviders: ObjectFieldCollectionProvider[]
  standardAttributeTypeResolvers: StandardAttributeTypeResolver[]
  virtualOwnerFieldResolvers: VirtualOwnerFieldResolver[]
  tableColumnResolvers: TableColumnResolver[]
  traversalTransitionResolvers: TraversalTransitionResolver[]
  registerRecordsItemResolvers: RegisterRecordsItemResolver[]
}

export function registerDataPathOwnerKind(registration: DataPathOwnerKindRegistration): void {
  ownerKinds.set(registration.kind, registration)
  for (const alias of registration.aliases ?? []) ownerKinds.set(alias, registration)
  for (const base of registration.typeDescriptionBases ?? []) ownerKindByTypeBase.set(base, registration.kind)
  for (const base of registration.registerRecordSetBases ?? []) ownerKindByRegisterRecordSetBase.set(base, registration.kind)
  for (const prefix of registration.metadataLinkPrefixes ?? []) {
    if (!ownerKindByMetadataLinkPrefix.has(prefix)) ownerKindByMetadataLinkPrefix.set(prefix, registration.kind)
  }
}

export function getDataPathOwnerKind(kind: string): DataPathOwnerKindRegistration | undefined {
  return ownerKinds.get(kind)
}

export function getOwnerKindByTypeDescriptionBase(baseType: string): string | undefined {
  return ownerKindByTypeBase.get(baseType)
}

export function getOwnerKindByRegisterRecordSetBase(baseType: string): string | undefined {
  return ownerKindByRegisterRecordSetBase.get(baseType)
}

export function getOwnerKindByMetadataLinkPrefix(prefix: string): string | undefined {
  return ownerKindByMetadataLinkPrefix.get(prefix)
}

export function getMetadataLinkPrefixesByOwnerKind(kind: string): readonly string[] {
  return ownerKinds.get(kind)?.metadataLinkPrefixes ?? []
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
  params: Parameters<StandardAttributeTypeResolver>[0],
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
  params: Parameters<VirtualOwnerFieldResolver>[0],
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

export function resolveRegisteredTableColumn(params: Parameters<TableColumnResolver>[0]): FormDataPathColumnSource | undefined {
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
  params: Parameters<TraversalTransitionResolver>[0],
): ReturnType<TraversalTransitionResolver> {
  for (const resolver of traversalTransitionResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerRegisterRecordsItemResolver(resolver: RegisterRecordsItemResolver): void {
  registerRecordsItemResolvers.push(resolver)
}

export function resolveRegisterRecordsItem(
  params: Parameters<RegisterRecordsItemResolver>[0],
): ReturnType<RegisterRecordsItemResolver> {
  return resolveMovementItem(params)
}

export function resolveMovementItem(
  params: Parameters<RegisterRecordsItemResolver>[0],
): ReturnType<RegisterRecordsItemResolver> {
  for (const resolver of registerRecordsItemResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function clearDataPathResolverRegistryForTests(): void {
  ownerKinds.clear()
  ownerKindByTypeBase.clear()
  ownerKindByRegisterRecordSetBase.clear()
  ownerKindByMetadataLinkPrefix.clear()
  typeResolvers.length = 0
  objectFieldCollectionProviders.length = 0
  standardAttributeTypeResolvers.length = 0
  virtualOwnerFieldResolvers.length = 0
  tableColumnResolvers.length = 0
  traversalTransitionResolvers.length = 0
  registerRecordsItemResolvers.length = 0
}

export function snapshotDataPathResolverRegistryForTests(): DataPathResolverRegistrySnapshot {
  return {
    ownerKinds: new Map(ownerKinds),
    ownerKindByTypeBase: new Map(ownerKindByTypeBase),
    ownerKindByRegisterRecordSetBase: new Map(ownerKindByRegisterRecordSetBase),
    ownerKindByMetadataLinkPrefix: new Map(ownerKindByMetadataLinkPrefix),
    typeResolvers: [...typeResolvers],
    objectFieldCollectionProviders: [...objectFieldCollectionProviders],
    standardAttributeTypeResolvers: [...standardAttributeTypeResolvers],
    virtualOwnerFieldResolvers: [...virtualOwnerFieldResolvers],
    tableColumnResolvers: [...tableColumnResolvers],
    traversalTransitionResolvers: [...traversalTransitionResolvers],
    registerRecordsItemResolvers: [...registerRecordsItemResolvers],
  }
}

export function restoreDataPathResolverRegistryForTests(snapshot: DataPathResolverRegistrySnapshot): void {
  clearDataPathResolverRegistryForTests()
  for (const [key, value] of snapshot.ownerKinds) ownerKinds.set(key, value)
  for (const [key, value] of snapshot.ownerKindByTypeBase) ownerKindByTypeBase.set(key, value)
  for (const [key, value] of snapshot.ownerKindByRegisterRecordSetBase) ownerKindByRegisterRecordSetBase.set(key, value)
  for (const [key, value] of snapshot.ownerKindByMetadataLinkPrefix) ownerKindByMetadataLinkPrefix.set(key, value)
  typeResolvers.push(...snapshot.typeResolvers)
  objectFieldCollectionProviders.push(...snapshot.objectFieldCollectionProviders)
  standardAttributeTypeResolvers.push(...snapshot.standardAttributeTypeResolvers)
  virtualOwnerFieldResolvers.push(...snapshot.virtualOwnerFieldResolvers)
  tableColumnResolvers.push(...snapshot.tableColumnResolvers)
  traversalTransitionResolvers.push(...snapshot.traversalTransitionResolvers)
  registerRecordsItemResolvers.push(...snapshot.registerRecordsItemResolvers)
}
