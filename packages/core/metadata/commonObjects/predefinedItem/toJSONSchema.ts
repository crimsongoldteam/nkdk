import { TSchema, Type } from "typebox"
import { PredefinedCodeJSONSchema } from "../predefinedCode/types"
import { ConfigurationContext } from "../../context/types"
import { recordOfSchemaRef } from "../../orchestration/jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "../../orchestration/property/toJSONSchema"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import {
  registerProjectJSONSchema,
  registerProjectJSONSchemaPropertyRefFactory,
} from "../../project/schemaRegistry"
import { PredefinedItemRules } from "./rules"

export const exportPredefinedItemCollectionToJSONSchema = (context: ConfigurationContext): TSchema => {
  const typeSchema = exportPropertyToJSONSchema({
    context,
    rule: PredefinedItemRules.properties.type,
    value: undefined,
  })

  const itemSchema = Type.Cyclic(
    {
      PredefinedItem: Type.Object(
        {
          Код: Type.Optional(PredefinedCodeJSONSchema),
          Наименование: Type.Optional(Type.String()),
          ЭтоГруппа: Type.Optional(Type.Literal("Истина")),
          ...(typeSchema ? { ТипЗначения: Type.Optional(typeSchema) } : {}),
          Элементы: Type.Optional(Type.Record(Type.String(), Type.Ref("PredefinedItem"))),
        },
        { additionalProperties: false }
      ),
    },
    "PredefinedItem"
  )

  return Type.Record(Type.String(), itemSchema)
}

const exportPredefinedItemYAMLToJSONSchema = (context: ConfigurationContext): TSchema => {
  const typeSchema = exportPropertyToJSONSchema({
    context,
    rule: PredefinedItemRules.properties.type,
    value: undefined,
  })

  return Type.Object(
    {
      Код: Type.Optional(PredefinedCodeJSONSchema),
      Наименование: Type.Optional(Type.String()),
      ЭтоГруппа: Type.Optional(Type.Literal("Истина")),
      ...(typeSchema ? { ТипЗначения: Type.Optional(typeSchema) } : {}),
      Элементы: Type.Optional(recordOfSchemaRef("PredefinedItemYAML")),
    },
    { additionalProperties: false }
  )
}

registerTypeRule("PredefinedItemCollection", "exportToJSONSchema", ({ context }) =>
  exportPredefinedItemCollectionToJSONSchema(context)
)
registerProjectJSONSchema("PredefinedItemYAML", ({ context }) => exportPredefinedItemYAMLToJSONSchema(context))
registerProjectJSONSchemaPropertyRefFactory("PredefinedItemCollection", () => recordOfSchemaRef("PredefinedItemYAML"))
