import { TSchema, Type } from "typebox"
import { ConfigurationContext } from "@nkdk/runtime"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../../ruleRuntime"
import { exportMetadataItemToJSONSchema } from "../../../ruleRuntime/metadataItem/toJSONSchema"
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

export const metadataPropertyRule000 = definePropertyTypeRule("FormCommands", "exportToJSONSchema", exportFormCommandsToJSONSchema)
