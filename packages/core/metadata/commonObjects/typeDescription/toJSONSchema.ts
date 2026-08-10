import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { buildTypeDescriptionJSONSchema } from "./allowedTypes"
import { TypeDescriptionJSONSchema } from "./types"

export const exportTypeDescriptionToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    return buildTypeDescriptionJSONSchema(rule.allowedTypes)
  }

  return TypeDescriptionJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)
