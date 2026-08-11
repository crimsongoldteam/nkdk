import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import type { OwnerTypeRef } from "./types"
import { currentDataPathRegistrySet } from "./dataPathExecutionContext"

export interface DataPathOwnerKindRegistration {
  kind: OwnerTypeRef["kind"]
  projectDir: string
  rule: MetadataItemRule
  typeDescriptionBases?: readonly string[]
  registerRecordSetBases?: readonly string[]
  metadataLinkPrefixes?: readonly string[]
  aliases?: readonly OwnerTypeRef["kind"][]
}

interface ContextualOwnerKindRegistry {
  getOwnerKind(kind: string): DataPathOwnerKindRegistration | undefined
  getOwnerKindByItemType(itemType: string): DataPathOwnerKindRegistration | undefined
  getOwnerKindByTypeDescriptionBase(baseType: string): string | undefined
  getOwnerKindByRegisterRecordSetBase(baseType: string): string | undefined
  getOwnerKindByMetadataLinkPrefix(prefix: string): string | undefined
  getMetadataLinkPrefixesByOwnerKind(kind: string): readonly string[]
}

export const getDataPathOwnerKind = (kind: string) =>
  currentDataPathRegistrySet<ContextualOwnerKindRegistry>()?.getOwnerKind(kind)
export function getDataPathOwnerKindByItemType(itemType: string): DataPathOwnerKindRegistration | undefined {
  return currentDataPathRegistrySet<ContextualOwnerKindRegistry>()?.getOwnerKindByItemType(itemType)
}
export const getOwnerKindByTypeDescriptionBase = (baseType: string) =>
  currentDataPathRegistrySet<ContextualOwnerKindRegistry>()?.getOwnerKindByTypeDescriptionBase(baseType)
export const getOwnerKindByRegisterRecordSetBase = (baseType: string) =>
  currentDataPathRegistrySet<ContextualOwnerKindRegistry>()?.getOwnerKindByRegisterRecordSetBase(baseType)
export const getOwnerKindByMetadataLinkPrefix = (prefix: string) =>
  currentDataPathRegistrySet<ContextualOwnerKindRegistry>()?.getOwnerKindByMetadataLinkPrefix(prefix)
export const getMetadataLinkPrefixesByOwnerKind = (kind: string): readonly string[] =>
  currentDataPathRegistrySet<ContextualOwnerKindRegistry>()?.getMetadataLinkPrefixesByOwnerKind(kind) ?? []
export const getReferenceTypeBaseByOwnerKind = (kind: string): string | undefined =>
  getDataPathOwnerKind(kind)?.typeDescriptionBases?.find((base) => base.endsWith("Ref"))
export const getRecordSetTypeBaseByOwnerKind = (kind: string): string | undefined =>
  getDataPathOwnerKind(kind)?.registerRecordSetBases?.[0]
