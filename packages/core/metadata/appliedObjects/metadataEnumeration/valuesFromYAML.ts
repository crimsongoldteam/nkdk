import { ConfigurationContext } from "../../context/types"
import { Type, type TSchema } from "typebox"
import {
  exportMetadataItemToYAML,
  PropertyRule,
  registerMetadataItemCollectionRule,
  registerTypeRule,
} from "../../orchestration"
import { recordOfSchemaRef } from "../../orchestration/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import {
  registerProjectJSONSchema,
  registerProjectJSONSchemaPropertyRefFactory,
} from "../../project/schemaRegistry"
import { MetadataEnumerationValueRules } from "./rules"
import {
  MetadataEnumerationValue,
  MetadataEnumerationValues,
  MetadataEnumerationValueYAML,
  MetadataEnumerationValuesYAML,
} from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataEnumerationValues",
  itemRule: MetadataEnumerationValueRules,
  xmlElement: "EnumValue",
  keyField: "name",
})

const exportMetadataEnumerationValuesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValues | undefined
): MetadataEnumerationValuesYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return Object.fromEntries(
    data.map((value) => {
      const { name, ...valueWithoutName } = value
      const valueForYAML = valueWithoutName as MetadataEnumerationValue
      const yaml = exportMetadataItemToYAML({
        context,
        rule: MetadataEnumerationValueRules,
        data: valueForYAML,
        name,
      }) as MetadataEnumerationValueYAML | undefined

      return [name, yaml ?? {}]
    })
  )
}

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

registerTypeRule("MetadataEnumerationValues", "exportToYAML", exportMetadataEnumerationValuesToYAML)
registerTypeRule("MetadataEnumerationValues", "exportToJSONSchema", ({ context }) =>
  exportMetadataEnumerationValuesToJSONSchema(context)
)
registerProjectJSONSchema("MetadataEnumerationValueYAML", ({ context }) =>
  exportMetadataEnumerationValueYAMLToJSONSchema(context)
)
registerProjectJSONSchemaPropertyRefFactory("MetadataEnumerationValues", () =>
  recordOfSchemaRef("MetadataEnumerationValueYAML")
)
