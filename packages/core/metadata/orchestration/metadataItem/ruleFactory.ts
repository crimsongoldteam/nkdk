import { Type } from "typebox"
import { PropertyRuleType } from "../property/registry"
import type { MetadataItemRule } from "../property/types"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { registerExportToXML } from "./registerExportToXML"
import { registerExportToYAML } from "./registerExportToYAML"
import { registerImportFromXML } from "./registerImportFromXML"
import { registerImportFromYAML } from "./registerImportFromYAML"
import { exportMetadataItemToJSONSchema } from "./toJSONSchema"

type MetadataItemRuleParams<Rule extends MetadataItemRule, PropertyType extends PropertyRuleType> = {
  propertyType: PropertyType
  itemRule: Rule
}

export const registerMetadataItemRule = <Rule extends MetadataItemRule, PropertyType extends PropertyRuleType>(
  params: MetadataItemRuleParams<Rule, PropertyType>
): void => {
  const { propertyType, itemRule } = params

  registerImportFromXML(propertyType, itemRule)
  registerImportFromYAML(propertyType, itemRule)
  registerExportToYAML(propertyType, itemRule)
  registerExportToXML(propertyType, itemRule)
  registerTypeRule(propertyType, "exportToJSONSchema", ({ context }) => {
    const schemaStack = context.exportToJSONSchema?.schemaStack ?? []
    if (schemaStack.includes(propertyType)) return Type.Unknown()

    return exportMetadataItemToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: {
          mode: context.exportToJSONSchema?.mode ?? "inline",
          refs: context.exportToJSONSchema?.refs ?? new Set(),
          includeNestedChildItems: context.exportToJSONSchema?.includeNestedChildItems,
          propertySchemaOverrides: context.exportToJSONSchema?.propertySchemaOverrides,
          schemaStack: [...schemaStack, propertyType],
        },
      },
      rule: itemRule,
    })
  })
}
