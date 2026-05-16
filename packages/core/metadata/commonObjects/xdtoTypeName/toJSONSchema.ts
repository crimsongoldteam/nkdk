import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { StringJSONSchema } from "~/metadata/commonObjects/string/types"

export const exportXDTOTypeNameToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return StringJSONSchema
}

registerTypeRule("XDTOTypeName", "exportToJSONSchema", exportXDTOTypeNameToJSONSchema)
