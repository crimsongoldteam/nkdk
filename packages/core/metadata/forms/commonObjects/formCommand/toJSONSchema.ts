import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { FormCommandRules } from "./rules"

export const exportFormCommandsToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: FormCommandRules,
  })
  return Type.Record(Type.String(), attributeSchema)
}

registerTypeRule("FormCommands", "exportToJSONSchema", exportFormCommandsToJSONSchema)
