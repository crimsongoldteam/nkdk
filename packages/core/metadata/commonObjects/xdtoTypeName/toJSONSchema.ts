import { Type, TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"

export const XDTOTypeNameJSONSchema = Type.Object({
  ПространствоИмен: Type.String(),
  Имя: Type.String(),
})

export const exportXDTOTypeNameToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return XDTOTypeNameJSONSchema
}

registerTypeRule("XDTOTypeName", "exportToJSONSchema", exportXDTOTypeNameToJSONSchema)
