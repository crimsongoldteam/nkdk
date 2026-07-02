import { ConfigurationContext } from "~/metadata/context/types"
import { Type, type TSchema } from "@sinclair/typebox"
import {
  exportMetadataItemToYAML,
  importMetadataItemFromYAML,
  PropertyRule,
  registerMetadataItemCollectionRule,
  registerTypeRule,
} from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
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

export const importMetadataEnumerationValuesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValuesYAML | undefined
): MetadataEnumerationValues | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]): MetadataEnumerationValue => {
    const imported = importMetadataItemFromYAML({
      context,
      yaml: value,
      rule: MetadataEnumerationValueRules,
      name,
    }) as MetadataEnumerationValue
    return { ...imported, name }
  })

  return results.length > 0 ? results : undefined
}

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
  const itemSchema = exportMetadataItemToJSONSchema({
    context,
    rule: MetadataEnumerationValueRules,
  }) as TSchema & { required?: string[] }

  itemSchema.required = itemSchema.required?.filter((key) => key !== "Имя")
  if (itemSchema.required?.length === 0) delete itemSchema.required

  return Type.Record(Type.String(), itemSchema)
}

registerTypeRule("MetadataEnumerationValues", "importFromYAML", importMetadataEnumerationValuesFromYAML)
registerTypeRule("MetadataEnumerationValues", "exportToYAML", exportMetadataEnumerationValuesToYAML)
registerTypeRule("MetadataEnumerationValues", "exportToJSONSchema", ({ context }) =>
  exportMetadataEnumerationValuesToJSONSchema(context)
)
