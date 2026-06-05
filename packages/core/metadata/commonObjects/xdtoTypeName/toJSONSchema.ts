import { Type, TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"

export const XDTOTypeNameJSONSchema = Type.Object({
  ПространствоИмен: Type.String(),
  Имя: Type.String(),
})

export const exportXDTOTypeNameToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return XDTOTypeNameJSONSchema
}

registerTypeRule("XDTOTypeName", "exportToJSONSchema", exportXDTOTypeNameToJSONSchema)
