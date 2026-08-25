import { TSchema, Type } from "typebox"
import { BooleanJSONSchema } from "../../boolean/types"
import { exportI8nTextToJSONSchema } from "../../i8nText/toJSONSchema"
import { definePropertyTypeRule } from "../../../ruleRuntime"
import { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { exportSystemEnumerationToJSONSchema } from "../../../systemEnumerations/toJSONSchema"

const requiredSchema = (schema: TSchema | undefined, name: string): TSchema => {
  if (schema === undefined) throw new Error(`${name} JSON schema is not registered`)
  return schema
}

const ordinaryField = Type.String()

export const exportAvailableFieldsToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const fieldSchema = ordinaryField
  const availableFieldItemObjectSchema = Type.Object(
    {
      Поле: fieldSchema,
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

  return Type.Array(Type.Union([fieldSchema, availableFieldItemObjectSchema]))
}

export const metadataPropertyRule000 = definePropertyTypeRule("AvailableFields", "exportToJSONSchema", exportAvailableFieldsToJSONSchema)
