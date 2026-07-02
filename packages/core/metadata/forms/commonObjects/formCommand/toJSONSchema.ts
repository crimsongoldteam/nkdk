import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "../../../context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { exportMetadataItemToJSONSchema } from "../../../orchestration/metadataItem/toJSONSchema"
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
