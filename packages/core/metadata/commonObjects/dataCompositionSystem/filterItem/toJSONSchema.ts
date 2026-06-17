import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { DcsMetadataTypedValueJSONSchema } from "../dscMetadataTypedValue/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

const FilterItemRightValueJSONSchema = Type.Union([
  DcsMetadataTypedValueJSONSchema,
  Type.Array(DcsMetadataTypedValueJSONSchema),
])

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
    context: createFilterItemSchemaContext(context),
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
  const itemSchema = Type.Recursive((This) =>
    Type.Union([
      createFilterItemComparisonSchema(context),
      exportMetadataItemToJSONSchema({
        context: createFilterItemSchemaContext(context, { FilterItem: Type.Array(This) }),
        rule: FilterItemGroupRules,
      }),
    ])
  )
  return Type.Array(itemSchema)
}
