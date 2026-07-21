import { registerProjectSpec } from "../../project/projectSpecRegistry"
import { createGenericProjectImportModel, createProjectSchemaExporter } from "../../project/projectSpecHelpers"
import { registerProjectJSONSchema } from "../../project/schemaRegistry"
import { join } from "path"
import type { OwnerMetadata } from "../../validation/dataPath/ownerCache"
import type { OwnerTypeRef } from "../../validation/dataPath/types"
import {
  getOwnerKindByMetadataLinkPrefix,
  registerDataPathOwnerKind,
  registerRegisterRecordsItemResolver,
  registerTraversalTransitionResolver,
} from "../../validation/dataPath/registry"
import { registerProjectReferenceObjectPathContributor } from "../../validation/projectReferenceIndexRegistry"
import { MetadataDocumentRules } from "./rules"
import { exportMetadataDocumentToJSONSchema } from "./toJSONSchema"
import "./standardMembers"

registerDataPathOwnerKind({
  kind: "Документ",
  projectDir: "Документ",
  rule: MetadataDocumentRules,
  typeDescriptionBases: ["DocumentRef"],
  metadataLinkPrefixes: ["Document"],
  aliases: ["ДокументОбъект"],
})
registerDataPathOwnerKind({
  kind: "ДокументОбъект",
  projectDir: "Документ",
  rule: MetadataDocumentRules,
  typeDescriptionBases: ["DocumentObject"],
  metadataLinkPrefixes: ["Document"],
})

registerTraversalTransitionResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "Документ" && owner.ref.kind !== "ДокументОбъект") return undefined
  if (segment !== "RegisterRecords" && segment !== "НаборЗаписей") return undefined

  return {
    typeInfo: { kinds: ["registerRecords"], nextTypes: [], sourceText: segment },
    sourceName: segment,
    sourceKind: "registerRecords",
    registerRecordsOwner: owner,
  }
})

registerRegisterRecordsItemResolver(({ owner, segment }) => {
  const registerRef = documentRegisterRecordRefs(owner).find((ref) => ref.name === segment)
  if (registerRef === undefined) return undefined

  const table = { kind: "RegisterRecordSet" as const, owner: registerRef }
  return {
    owner: registerRef,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: `RegisterRecords.${segment}`,
    },
    tableSource: {
      table,
      columns: new Map(),
      hasColumns: true,
    },
  }
})

registerProjectJSONSchema("MetadataDocument", ({ context }) => exportMetadataDocumentToJSONSchema({ context }))
registerProjectReferenceObjectPathContributor("Document", ({ projectDir, target }) => ({
  filePath: join(projectDir, "Документ", target.objectName, "Свойства.yaml"),
}))

registerProjectSpec({
  kind: "document",
  dir: "Документ",
  rule: MetadataDocumentRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataDocumentToJSONSchema({ context })),
  importModel: createGenericProjectImportModel(MetadataDocumentRules),
})

function documentRegisterRecordRefs(owner: OwnerMetadata): OwnerTypeRef[] {
  const value = metadataRecord(owner.facts).registerRecords
  if (!Array.isArray(value)) return []

  return value.map(registerRecordRefFromLink).filter((ref): ref is OwnerTypeRef => ref !== undefined)
}

function registerRecordRefFromLink(value: unknown): OwnerTypeRef | undefined {
  if (typeof value !== "string") return undefined

  const dotIndex = value.indexOf(".")
  if (dotIndex === -1) return undefined

  const kind = getOwnerKindByMetadataLinkPrefix(value.substring(0, dotIndex))
  if (kind === undefined) return undefined

  const name = value.substring(dotIndex + 1)
  if (name.length === 0) return undefined

  return { kind, name }
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
