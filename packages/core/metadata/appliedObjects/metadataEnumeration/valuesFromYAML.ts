import { ConfigurationContext } from "../../context/types"
import { Type, type TSchema } from "typebox"
import { registerMetadataItemCollectionRule, registerTypeRule } from "../../orchestration"
import { recordOfSchemaRef } from "../../orchestration/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { registerProjectJSONSchema, registerProjectJSONSchemaPropertyRefFactory } from "../../project/schemaRegistry"
import { MetadataEnumerationValueRules } from "./rules"

registerMetadataItemCollectionRule({
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

registerTypeRule("MetadataEnumerationValues", "exportToJSONSchema", ({ context }) =>
  exportMetadataEnumerationValuesToJSONSchema(context)
)
registerProjectJSONSchema("MetadataEnumerationValueYAML", ({ context }) =>
  exportMetadataEnumerationValueYAMLToJSONSchema(context)
)
registerProjectJSONSchemaPropertyRefFactory("MetadataEnumerationValues", () =>
  recordOfSchemaRef("MetadataEnumerationValueYAML")
)
