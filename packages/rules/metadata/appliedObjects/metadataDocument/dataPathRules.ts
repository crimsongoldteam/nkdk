import type { OwnerMetadata } from "../../validation/dataPath/ownerCache"
import type { OwnerTypeRef } from "../../validation/dataPath/types"
import type { DataPathContribution, DataPathOwnerKindLookup } from "../../validation/dataPath/registry"

export const metadataDocumentDataPathRules: DataPathContribution = {
  kind: "provider",
  create: (ownerKinds) => [
    {
      kind: "traversalTransition",
      resolver: ({ owner, segment }) => {
        if (owner.ref.kind !== "Документ" && owner.ref.kind !== "ДокументОбъект") return undefined
        if (segment !== "RegisterRecords" && segment !== "НаборЗаписей") return undefined
        return {
          typeInfo: { kinds: ["registerRecords"], nextTypes: [], sourceText: segment },
          sourceName: segment,
          sourceKind: "registerRecords",
          registerRecordsOwner: owner,
        }
      },
    },
    {
      kind: "registerRecordsItem",
      resolver: ({ owner, segment }) => {
        const registerRef = documentRegisterRecordRefs(owner, ownerKinds).find((ref) => ref.name === segment)
        if (registerRef === undefined) return undefined
        const table = { kind: "RegisterRecordSet" as const, owner: registerRef }
        return {
          owner: registerRef,
          typeInfo: { kinds: ["tableSource"], nextTypes: [], table, sourceText: `RegisterRecords.${segment}` },
          tableSource: { table, columns: new Map(), hasColumns: true },
        }
      },
    },
  ],
}

function documentRegisterRecordRefs(owner: OwnerMetadata, ownerKinds: DataPathOwnerKindLookup): OwnerTypeRef[] {
  const value = metadataRecord(owner.facts).registerRecords
  if (!Array.isArray(value)) return []
  return value.map((item) => registerRecordRefFromLink(item, ownerKinds)).filter((ref): ref is OwnerTypeRef => ref !== undefined)
}

function registerRecordRefFromLink(value: unknown, ownerKinds: DataPathOwnerKindLookup): OwnerTypeRef | undefined {
  if (typeof value !== "string") return undefined
  const dotIndex = value.indexOf(".")
  if (dotIndex === -1) return undefined
  const kind = ownerKinds.getByMetadataLinkPrefix(value.substring(0, dotIndex))
  const name = value.substring(dotIndex + 1)
  return kind === undefined || name.length === 0 ? undefined : { kind, name }
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
