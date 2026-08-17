import { TSchema, Type } from "typebox"
import { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataItemToJSONSchema } from "../../../ruleRuntime/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
import { exportDcsMetadataValueToJSONSchema } from "../dcsMetadataValue/toJSONSchema"
import { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
import { DcsMetadataTypedValueJSONSchema } from "../dscMetadataTypedValue/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

const DcsMetadataTypedValueNilArrayItemJSONSchema = Type.Object({}, { additionalProperties: false })

const ordinaryDcsMetadataTypedValueJSONSchema = Type.Intersect([
  DcsMetadataTypedValueJSONSchema,
  { not: Type.String({ pattern: "^!xml/(?:[^ ]+)(?: |$)" }) } as TSchema,
])
const xmlValueFieldJSONSchema = Type.String({ pattern: "^!xml/value[ \\t]+\\S.*$" })

const dcsMetadataTypedValueSchema = (context: ConfigurationContext): TSchema =>
  context.exportToJSONSchema?.explicitXMLValues === true ||
  context.exportToJSONSchema?.validationPropertyRefs === true
    ? Type.Union([ordinaryDcsMetadataTypedValueJSONSchema, xmlValueFieldJSONSchema])
    : ordinaryDcsMetadataTypedValueJSONSchema

const FilterItemRightValueArrayItemJSONSchema = Type.Union([
  ordinaryDcsMetadataTypedValueJSONSchema,
  DcsMetadataTypedValueNilArrayItemJSONSchema,
])

const filterItemRightValueJSONSchema = (context: ConfigurationContext): TSchema => Type.Union([
  dcsMetadataTypedValueSchema(context),
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
    ...context.exportToJSONSchema,
    mode: context.exportToJSONSchema?.mode ?? "inline",
    refs: context.exportToJSONSchema?.refs ?? new Set(),
    propertySchemaOverrides: {
      ...context.exportToJSONSchema?.propertySchemaOverrides,
      DcsMetadataTypedValue: dcsMetadataTypedValueSchema(context),
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
      ПравоеЗначение: Type.Optional(filterItemRightValueJSONSchema(context)),
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
