import { TSchema, Type } from "@sinclair/typebox"
import { PredefinedCodeJSONSchema } from "../predefinedCode/types"
import { ConfigurationContext } from "../../context/types"
import { exportPropertyToJSONSchema } from "../../orchestration/property/toJSONSchema"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { PredefinedItemRules } from "./rules"

export const exportPredefinedItemCollectionToJSONSchema = (context: ConfigurationContext): TSchema => {
  const typeSchema = exportPropertyToJSONSchema({
    context,
    rule: PredefinedItemRules.properties.type,
    value: undefined,
  })

  const itemSchema = Type.Recursive((self) =>
    Type.Object(
      {
        Код: Type.Optional(PredefinedCodeJSONSchema),
        Наименование: Type.Optional(Type.String()),
        ЭтоГруппа: Type.Optional(Type.Literal("Истина")),
        ...(typeSchema ? { ТипЗначения: Type.Optional(typeSchema) } : {}),
        Элементы: Type.Optional(Type.Record(Type.String(), self)),
      },
      { additionalProperties: false }
    )
  )

  return Type.Record(Type.String(), itemSchema)
}

registerTypeRule("PredefinedItemCollection", "exportToJSONSchema", ({ context }) =>
  exportPredefinedItemCollectionToJSONSchema(context)
)
