import { TSchema, Type } from "typebox"
import { ConfigurationContext } from "../../../context/types"
import { exportMetadataItemToJSONSchema } from "../../../orchestration/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "../../../orchestration/property/fn"
import { exportDcsMetadataValueToJSONSchema } from "../dcsMetadataValue/toJSONSchema"
import { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
import { DcsMetadataTypedValueJSONSchema } from "../dscMetadataTypedValue/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

const DcsMetadataTypedValueNilArrayItemJSONSchema = Type.Object({}, { additionalProperties: false })

const FilterItemRightValueArrayItemJSONSchema = Type.Union([
  DcsMetadataTypedValueJSONSchema,
  DcsMetadataTypedValueNilArrayItemJSONSchema,
])

const FilterItemRightValueJSONSchema = Type.Union([
  DcsMetadataTypedValueJSONSchema,
  Type.Array(FilterItemRightValueArrayItemJSONSchema),
])

const FilterItemPresentationValueRule = {
  type: "MetadataDcsMetadataValue",
  valueType: "DesignTimeValue",
} as const satisfies DcsMetadataValuePropertyRule

const createFilterItemPresentationValueJSONSchema = (context: ConfigurationContext): TSchema =>
  exportDcsMetadataValueToJSONSchema({
    context,
    rule: FilterItemPresentationValueRule,
    value: undefined,
  }) ?? Type.Unknown()

const createFilterItemSchemaContext = (
  context: ConfigurationContext,
  propertySchemaOverrides = {}
): ConfigurationContext => ({
  ...context,
  exportToJSONSchema: {
    mode: context.exportToJSONSchema?.mode ?? "inline",
    refs: context.exportToJSONSchema?.refs ?? new Set(),
    propertySchemaOverrides: {
      ...context.exportToJSONSchema?.propertySchemaOverrides,
      DcsMetadataTypedValue: DcsMetadataTypedValueJSONSchema,
      ...propertySchemaOverrides,
    },
    schemaStack: context.exportToJSONSchema?.schemaStack,
  },
})

type ObjectSchemaWithProperties = TSchema & {
  properties?: Record<string, TSchema>
}

const createFilterItemComparisonSchema = (context: ConfigurationContext): TSchema => {
  const comparisonSchema = exportMetadataItemToJSONSchema({
    context: createFilterItemSchemaContext(context, {
      FilterItemPresentationValue: createFilterItemPresentationValueJSONSchema(context),
    }),
    rule: FilterItemComparisonRules,
  }) as ObjectSchemaWithProperties

  if (comparisonSchema.properties?.["ПравоеЗначение"] === undefined) return comparisonSchema

  return Type.Object(
    {
      ...comparisonSchema.properties,
      ПравоеЗначение: Type.Optional(FilterItemRightValueJSONSchema),
    },
    { additionalProperties: false }
  )
}

export const exportFilterItemToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const itemSchema = Type.Cyclic(
    {
      FilterItem: Type.Union([
        createFilterItemComparisonSchema(context),
        exportMetadataItemToJSONSchema({
          context: createFilterItemSchemaContext(context, {
            FilterItem: Type.Array(Type.Ref("FilterItem")),
            FilterItemPresentationValue: createFilterItemPresentationValueJSONSchema(context),
          }),
          rule: FilterItemGroupRules,
        }),
      ]),
    },
    "FilterItem"
  )
  return Type.Array(itemSchema)
}
