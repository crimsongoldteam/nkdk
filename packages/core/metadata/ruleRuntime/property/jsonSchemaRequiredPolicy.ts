import type { ConfigurationContext } from "../../context/types"
import type { PropertyRuleType } from "./registry"
import type { MetadataItemRule } from "./types"

export function withNestedJSONSchemaRequiredPolicy(
  context: ConfigurationContext,
  itemRule: MetadataItemRule,
): ConfigurationContext {
  const exportContext = context.exportToJSONSchema
  if (exportContext?.requiredPolicy === undefined) return context
  const deferred = itemRule.externalMetadata !== undefined
  return {
    ...context,
    exportToJSONSchema: {
      ...exportContext,
      requiredPolicy: {
        currentBoundary: deferred ? "defer" : "full",
        cacheVariant: deferred ? "extension-overlay" : "full",
      },
    },
  }
}

export function withNestedJSONSchemaItemContext(
  context: ConfigurationContext,
  itemRule: MetadataItemRule,
  propertyType: PropertyRuleType,
): ConfigurationContext {
  const nestedContext = withNestedJSONSchemaRequiredPolicy(context, itemRule)
  const schemaStack = context.exportToJSONSchema?.schemaStack ?? []
  return {
    ...nestedContext,
    exportToJSONSchema: {
      ...nestedContext.exportToJSONSchema,
      mode: nestedContext.exportToJSONSchema?.mode ?? "inline",
      refs: nestedContext.exportToJSONSchema?.refs ?? new Set(),
      schemaStack: [...schemaStack, propertyType],
    },
  }
}
