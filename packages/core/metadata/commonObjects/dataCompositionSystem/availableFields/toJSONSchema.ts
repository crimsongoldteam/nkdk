import { TSchema, Type } from "@sinclair/typebox"
import { BooleanJSONSchema } from "~/metadata/commonObjects/boolean/types"
import { exportI8nTextToJSONSchema } from "~/metadata/commonObjects/i8nText/toJSONSchema"
import { registerTypeRule } from "~/metadata/orchestration"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { exportSystemEnumerationToJSONSchema } from "~/metadata/systemEnumerations/toJSONSchema"

const requiredSchema = (schema: TSchema | undefined, name: string): TSchema => {
  if (schema === undefined) throw new Error(`${name} JSON schema is not registered`)
  return schema
}

export const exportAvailableFieldsToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const availableFieldItemObjectSchema = Type.Object(
    {
      Поле: Type.String(),
      Использование: Type.Optional(BooleanJSONSchema),
      Заголовок: Type.Optional(
        requiredSchema(exportI8nTextToJSONSchema({ context, rule: { type: "I8nText" }, value: undefined }), "I8nText")
      ),
      МногоязычныйЗаголовок: Type.Optional(
        requiredSchema(exportI8nTextToJSONSchema({ context, rule: { type: "I8nText" }, value: undefined }), "I8nText")
      ),
      РежимОтображения: Type.Optional(
        requiredSchema(
          exportSystemEnumerationToJSONSchema({
            context,
            rule: { type: "SystemEnumeration", typeSE: "DataCompositionSettingsItemViewMode" },
            value: undefined,
          }),
          "DataCompositionSettingsItemViewMode"
        )
      ),
    },
    { additionalProperties: false }
  )

  return Type.Array(Type.Union([Type.String(), availableFieldItemObjectSchema]))
}

registerTypeRule("AvailableFields", "exportToJSONSchema", exportAvailableFieldsToJSONSchema)
