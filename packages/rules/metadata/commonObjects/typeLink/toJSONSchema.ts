import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { TypeLinkJSONSchema } from "./types"

export const exportTypeLinkToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return TypeLinkJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeLink", "exportToJSONSchema", exportTypeLinkToJSONSchema)
