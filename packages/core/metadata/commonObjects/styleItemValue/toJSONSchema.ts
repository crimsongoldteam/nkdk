import { TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { BorderJSONSchema } from "../border/types"
import { ColorJSONSchema } from "../color/types"
import { FontJSONSchema } from "../font/types"

const styleItemValueVariant = (kind: "Шрифт" | "Цвет" | "Рамка", valueSchema: TSchema): TSchema =>
  Type.Object(
    {
      Вид: Type.Literal(kind),
      Значение: valueSchema,
    },
    { additionalProperties: false }
  )

export const StyleItemValueJSONSchema = Type.Union([
  styleItemValueVariant("Шрифт", FontJSONSchema),
  styleItemValueVariant("Цвет", ColorJSONSchema),
  styleItemValueVariant("Рамка", BorderJSONSchema),
])

export const exportStyleItemValueToJSONSchema: ExportToJSONSchemaFn = (): TSchema => StyleItemValueJSONSchema

export const metadataPropertyRule000 = definePropertyTypeRule("StyleItemValue", "exportToJSONSchema", exportStyleItemValueToJSONSchema)
