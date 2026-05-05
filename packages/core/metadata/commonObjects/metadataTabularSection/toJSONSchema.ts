import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataTabularSectionRules } from "./rules"

export const exportMetadataTabularSectionsToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const tabularSectionSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: MetadataTabularSectionRules,
  })
  return Type.Record(Type.String(), tabularSectionSchema)
}

registerTypeRule("MetadataTabularSections", "exportToJSONSchema", exportMetadataTabularSectionsToJSONSchema)
