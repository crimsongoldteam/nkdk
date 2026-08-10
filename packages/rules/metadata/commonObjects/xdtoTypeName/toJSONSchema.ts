import { Type, TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"

export const XDTOTypeNameJSONSchema = Type.Object({
  ПространствоИмен: Type.String(),
  Имя: Type.String(),
})

export const exportXDTOTypeNameToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return XDTOTypeNameJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("XDTOTypeName", "exportToJSONSchema", exportXDTOTypeNameToJSONSchema)
