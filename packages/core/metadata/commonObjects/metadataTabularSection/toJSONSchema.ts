import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MetadataTabularSectionsJSONSchema } from "./types"

export const exportMetadataTabularSectionsToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MetadataTabularSectionsJSONSchema
}

registerTypeRule("MetadataTabularSections", "exportToJSONSchema", exportMetadataTabularSectionsToJSONSchema)
