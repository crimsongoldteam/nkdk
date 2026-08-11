import { TSchema, Type } from "typebox"
import { PredefinedCodeJSONSchema } from "../predefinedCode/types"
import { ConfigurationContext } from "../../context/types"
import { recordOfSchemaRef } from "../../ruleRuntime/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { registerTypeRule, resolvePropertyItemRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../../ruleRuntime/property/types"
import {
  registerProjectJSONSchema,
  registerProjectJSONSchemaPropertyRefFactory,
} from "../../projectDefinition/schemaRegistry"
import { PredefinedItemRules } from "./rules"

export const exportPredefinedItemCollectionToJSONSchema = (
  context: ConfigurationContext,
  itemRule: MetadataItemRule = PredefinedItemRules,
): TSchema => {
  if (itemRule !== PredefinedItemRules) {
    return Type.Record(Type.String(), exportMetadataItemToJSONSchema({ context, rule: itemRule }))
  }

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

registerTypeRule("PredefinedItemCollection", "exportToJSONSchema", ({ context, rule }) =>
  exportPredefinedItemCollectionToJSONSchema(context, predefinedItemRule(rule))
)
registerProjectJSONSchema("PredefinedItemYAML", ({ context }) => exportPredefinedItemYAMLToJSONSchema(context))
registerProjectJSONSchemaPropertyRefFactory("PredefinedItemCollection", ({ context, rule }) => {
  const itemRule = predefinedItemRule(rule)
  return itemRule === PredefinedItemRules
    ? recordOfSchemaRef("PredefinedItemYAML")
    : exportPredefinedItemCollectionToJSONSchema(context, itemRule)
})

function predefinedItemRule(rule: PropertyRule): MetadataItemRule {
  return resolvePropertyItemRule(rule, PredefinedItemRules) ?? PredefinedItemRules
}
