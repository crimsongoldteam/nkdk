import { Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { DcsMetadataTypedValueJSONSchema } from "../dscMetadataTypedValue/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

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

export const exportFilterItemToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const itemSchema = Type.Recursive((This) =>
    Type.Union([
      exportMetadataItemToJSONSchema({
        context: createFilterItemSchemaContext(context),
        rule: FilterItemComparisonRules,
      }),
      exportMetadataItemToJSONSchema({
        context: createFilterItemSchemaContext(context, { FilterItem: Type.Array(This) }),
        rule: FilterItemGroupRules,
      }),
    ])
  )
  return Type.Array(itemSchema)
}
