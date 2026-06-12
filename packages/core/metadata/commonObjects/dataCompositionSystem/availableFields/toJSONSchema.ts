import { Type } from "@sinclair/typebox"
import { BooleanJSONSchema } from "~/metadata/commonObjects/boolean/types"
import { exportI8nTextToJSONSchema } from "~/metadata/commonObjects/i8nText/toJSONSchema"
import { registerTypeRule } from "~/metadata/orchestration"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { exportSystemEnumerationToJSONSchema } from "~/metadata/systemEnumerations/toJSONSchema"

export const exportAvailableFieldsToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const availableFieldItemObjectSchema = Type.Object(
    {
      Поле: Type.String(),
      Использование: Type.Optional(BooleanJSONSchema),
      Заголовок: Type.Optional(exportI8nTextToJSONSchema({ context, rule: { type: "I8nText" }, value: undefined })),
      МногоязычныйЗаголовок: Type.Optional(
        exportI8nTextToJSONSchema({ context, rule: { type: "I8nText" }, value: undefined })
      ),
      РежимОтображения: Type.Optional(
        exportSystemEnumerationToJSONSchema({
          context,
          rule: { type: "SystemEnumeration", typeSE: "DataCompositionSettingsItemViewMode" },
          value: undefined,
        })
      ),
    },
    { additionalProperties: false }
  )

  return Type.Array(Type.Union([Type.String(), availableFieldItemObjectSchema]))
}

registerTypeRule("AvailableFields", "exportToJSONSchema", exportAvailableFieldsToJSONSchema)
