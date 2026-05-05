import { TSchema } from "@sinclair/typebox"
import { TypeCheck, TypeCompiler } from "@sinclair/typebox/compiler"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataCatalogToJSONSchema } from "../appliedObjects/metadataCatalog/toJSONSchema"
import { exportMetadataDocumentToJSONSchema } from "../appliedObjects/metadataDocument/toJSONSchema"
import { exportMetadataEnumerationToJSONSchema } from "../appliedObjects/metadataEnumeration/toJSONSchema"
import { MetadataKind } from "./types"

export interface SchemaCache {
  get(kind: MetadataKind): TypeCheck<TSchema>
}

export function createSchemaCache(context: ConfigurationContext): SchemaCache {
  const cache = new Map<MetadataKind, TypeCheck<TSchema>>()

  return {
    get(kind: MetadataKind): TypeCheck<TSchema> {
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
      }

      const compiled = TypeCompiler.Compile(schema)
      cache.set(kind, compiled)
      return compiled
    },
  }
}
