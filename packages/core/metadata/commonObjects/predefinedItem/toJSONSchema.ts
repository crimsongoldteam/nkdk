import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import { TSchema, Type } from "typebox"
import { PredefinedCodeJSONSchema } from "../predefinedCode/types"
import { ConfigurationContext } from "../../context/types"
import { recordOfSchemaRef } from "../../ruleRuntime/jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import {
  defineMetadataRules,
} from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
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

export const metadataPropertyRule000 = definePropertyTypeRule("PredefinedItemCollection", "exportToJSONSchema", ({ context }) =>
  exportPredefinedItemCollectionToJSONSchema(context)
)
export const metadataRuleLayer000 = defineMetadataRules({
  ...emptyMetadataRules,
  schemas: {
    PredefinedItemYAML: {
      source: PredefinedItemRules,
      export: ({ context }) => exportPredefinedItemYAMLToJSONSchema(context),
    },
  },
  schemaPropertyRefs: {
    PredefinedItemCollection: () => recordOfSchemaRef("PredefinedItemYAML"),
  },
})
