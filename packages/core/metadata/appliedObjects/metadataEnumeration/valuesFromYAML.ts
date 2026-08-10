import { ConfigurationContext } from "../../context/types"
import { Type, type TSchema } from "typebox"
import { composeMetadataRules, defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { recordOfSchemaRef } from "../../ruleRuntime/jsonSchemaRefs"
import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { MetadataEnumerationValueRules } from "./rules"

const collectionRules = defineMetadataItemCollectionRule({
  propertyType: "MetadataEnumerationValues",
  itemRule: MetadataEnumerationValueRules,
  xmlElement: "EnumValue",
  keyField: "name",
})

const exportMetadataEnumerationValuesToJSONSchema = (context: ConfigurationContext): TSchema => {
  return Type.Record(Type.String(), exportMetadataEnumerationValueYAMLToJSONSchema(context))
}

const exportMetadataEnumerationValueYAMLToJSONSchema = (context: ConfigurationContext): TSchema => {
  const itemSchema = exportMetadataItemToJSONSchema({
    context,
    rule: MetadataEnumerationValueRules,
  }) as TSchema & { required?: string[] }

  itemSchema.required = itemSchema.required?.filter((key) => key !== "Имя")
  if (itemSchema.required?.length === 0) delete itemSchema.required

  return itemSchema
}

const schemaRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: {
    MetadataEnumerationValues: {
      exportToJSONSchema: ({ context }) =>
        exportMetadataEnumerationValuesToJSONSchema(context),
    },
  },
  schemas: {
    MetadataEnumerationValueYAML: {
      export: ({ context }) =>
        exportMetadataEnumerationValueYAMLToJSONSchema(context),
    },
  },
  schemaPropertyRefs: {
    MetadataEnumerationValues: () =>
      recordOfSchemaRef("MetadataEnumerationValueYAML"),
  },
})

export const metadataRuleLayer000 = composeMetadataRules(
  collectionRules,
  schemaRules,
)
