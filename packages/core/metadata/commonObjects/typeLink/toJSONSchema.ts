import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { TypeLinkJSONSchema } from "./types"

export const exportTypeLinkToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return TypeLinkJSONSchema
}

registerTypeRule("TypeLink", "exportToJSONSchema", exportTypeLinkToJSONSchema)
