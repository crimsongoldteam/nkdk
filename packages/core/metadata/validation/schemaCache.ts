import { compileValidationSchema, type ValidationSchemaValidator } from "./compileValidationSchema"
import type { TSchema } from "typebox"
import { MetadataAccumulationRegisterRules } from "../appliedObjects/metadataAccumulationRegister/rules"
import { ConfigurationContext } from "../context/types"
import { exportMetadataCatalogToJSONSchema } from "../appliedObjects/metadataCatalog/toJSONSchema"
import { MetadataDataProcessorRules } from "../appliedObjects/metadataDataProcessor/rules"
import { exportMetadataDocumentToJSONSchema } from "../appliedObjects/metadataDocument/toJSONSchema"
import { MetadataDocumentJournalRules } from "../appliedObjects/metadataDocumentJournal/rules"
import { exportMetadataEnumerationToJSONSchema } from "../appliedObjects/metadataEnumeration/toJSONSchema"
import { MetadataExchangePlanRules } from "../appliedObjects/metadataExchangePlan/rules"
import { MetadataHTTPServiceRules } from "../appliedObjects/metadataHTTPService/rules"
import { MetadataInformationRegisterRules } from "../appliedObjects/metadataInformationRegister/rules"
import { exportMetadataItemToJSONSchema } from "../orchestration/metadataItem/toJSONSchema"
import { MetadataKind } from "./types"

export interface SchemaCache {
  get(kind: MetadataKind): ValidationSchemaValidator<TSchema>
}

export function createSchemaCache(context: ConfigurationContext): SchemaCache {
  const cache = new Map<MetadataKind, ValidationSchemaValidator<TSchema>>()

  return {
    get(kind: MetadataKind): ValidationSchemaValidator<TSchema> {
      const cached = cache.get(kind)
      if (cached) return cached

      let schema: TSchema
      switch (kind) {
        case "catalog":
          schema = exportMetadataCatalogToJSONSchema({ context })
          break
        case "document":
          schema = exportMetadataDocumentToJSONSchema({ context })
          break
        case "enumeration":
          schema = exportMetadataEnumerationToJSONSchema({ context })
          break
        case "dataProcessor":
          schema = exportMetadataItemToJSONSchema({ context, rule: MetadataDataProcessorRules })
          break
        case "documentJournal":
          schema = exportMetadataItemToJSONSchema({ context, rule: MetadataDocumentJournalRules })
          break
        case "httpService":
          schema = exportMetadataItemToJSONSchema({ context, rule: MetadataHTTPServiceRules })
          break
        case "informationRegister":
          schema = exportMetadataItemToJSONSchema({ context, rule: MetadataInformationRegisterRules })
          break
        case "accumulationRegister":
          schema = exportMetadataItemToJSONSchema({ context, rule: MetadataAccumulationRegisterRules })
          break
        case "exchangePlan":
          schema = exportMetadataItemToJSONSchema({ context, rule: MetadataExchangePlanRules })
          break
      }

      const compiled = compileValidationSchema(schema)
      cache.set(kind, compiled)
      return compiled
    },
  }
}
