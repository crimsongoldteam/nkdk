import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { TypeLinkJSONSchema } from "./types"

export const exportTypeLinkToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return TypeLinkJSONSchema
}

registerTypeRule("TypeLink", "exportToJSONSchema", exportTypeLinkToJSONSchema)
