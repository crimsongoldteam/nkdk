import type { MetadataItemRule } from "../../orchestration/property/types"
import type { OwnerTypeRef } from "./types"

export interface DataPathOwnerKindRegistration {
  kind: OwnerTypeRef["kind"]
  projectDir: string
  rule: MetadataItemRule
  typeDescriptionBases?: readonly string[]
  registerRecordSetBases?: readonly string[]
  metadataLinkPrefixes?: readonly string[]
  aliases?: readonly OwnerTypeRef["kind"][]
}

export interface OwnerKindRegistrySnapshot {
  ownerKinds: Map<string, DataPathOwnerKindRegistration>
  ownerKindByTypeBase: Map<string, string>
  ownerKindByRegisterRecordSetBase: Map<string, string>
  ownerKindByMetadataLinkPrefix: Map<string, string>
}

const ownerKinds = new Map<string, DataPathOwnerKindRegistration>()
const ownerKindByTypeBase = new Map<string, string>()
const ownerKindByRegisterRecordSetBase = new Map<string, string>()
const ownerKindByMetadataLinkPrefix = new Map<string, string>()

export function registerDataPathOwnerKind(registration: DataPathOwnerKindRegistration): void {
  ownerKinds.set(registration.kind, registration)
  for (const alias of registration.aliases ?? []) ownerKinds.set(alias, registration)
  for (const base of registration.typeDescriptionBases ?? []) ownerKindByTypeBase.set(base, registration.kind)
  for (const base of registration.registerRecordSetBases ?? []) ownerKindByRegisterRecordSetBase.set(base, registration.kind)
  for (const prefix of registration.metadataLinkPrefixes ?? []) {
    if (!ownerKindByMetadataLinkPrefix.has(prefix)) ownerKindByMetadataLinkPrefix.set(prefix, registration.kind)
  }
}

export const getDataPathOwnerKind = (kind: string) => ownerKinds.get(kind)
export function getDataPathOwnerKindByItemType(itemType: string): DataPathOwnerKindRegistration | undefined {
  for (const registration of ownerKinds.values()) if (registration.rule.itemType === itemType) return registration
  return undefined
}
export const getOwnerKindByTypeDescriptionBase = (baseType: string) => ownerKindByTypeBase.get(baseType)
export const getOwnerKindByRegisterRecordSetBase = (baseType: string) => ownerKindByRegisterRecordSetBase.get(baseType)
export const getOwnerKindByMetadataLinkPrefix = (prefix: string) => ownerKindByMetadataLinkPrefix.get(prefix)
export const getMetadataLinkPrefixesByOwnerKind = (kind: string): readonly string[] => ownerKinds.get(kind)?.metadataLinkPrefixes ?? []

export function clearOwnerKindRegistryForTests(): void {
  ownerKinds.clear()
  ownerKindByTypeBase.clear()
  ownerKindByRegisterRecordSetBase.clear()
  ownerKindByMetadataLinkPrefix.clear()
}

export function snapshotOwnerKindRegistryForTests(): OwnerKindRegistrySnapshot {
  return {
    ownerKinds: new Map(ownerKinds),
    ownerKindByTypeBase: new Map(ownerKindByTypeBase),
    ownerKindByRegisterRecordSetBase: new Map(ownerKindByRegisterRecordSetBase),
    ownerKindByMetadataLinkPrefix: new Map(ownerKindByMetadataLinkPrefix),
  }
}

export function restoreOwnerKindRegistryForTests(snapshot: OwnerKindRegistrySnapshot): void {
  clearOwnerKindRegistryForTests()
  for (const [key, value] of snapshot.ownerKinds) ownerKinds.set(key, value)
  for (const [key, value] of snapshot.ownerKindByTypeBase) ownerKindByTypeBase.set(key, value)
  for (const [key, value] of snapshot.ownerKindByRegisterRecordSetBase) ownerKindByRegisterRecordSetBase.set(key, value)
  for (const [key, value] of snapshot.ownerKindByMetadataLinkPrefix) ownerKindByMetadataLinkPrefix.set(key, value)
}
