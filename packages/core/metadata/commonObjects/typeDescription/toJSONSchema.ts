import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { buildTypeDescriptionJSONSchema } from "./allowedTypes"
import { TypeDescriptionJSONSchema } from "./types"

export const exportTypeDescriptionToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    return buildTypeDescriptionJSONSchema(rule.allowedTypes)
  }

  return TypeDescriptionJSONSchema
}

registerTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)
