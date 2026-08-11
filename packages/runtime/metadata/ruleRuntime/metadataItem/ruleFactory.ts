import { Type } from "typebox"
import type { ConfigurationContext } from "../../context/types"
import { PropertyRuleType } from "../property/registry"
import type { MetadataItemRule } from "../property/types"
import { registerLegacyPropertyTypeDefinitions } from "../property/typeRuleRegistry"
import {
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "../property/propertyRuleRegistrySet"
import { defineMetadataRules } from "../definition"
import { registerLegacySchemaDefinitions } from "../definition/legacyRuleRegistration"
import { emptyMetadataRules } from "../definition/testSupport"
import { importMetadataItemFromXMLToYAML } from "./fromXMLToYAML"
import { exportMetadataItemToJSONSchema } from "./toJSONSchema"
import { withNestedJSONSchemaItemContext } from "../property/jsonSchemaRequiredPolicy"

type MetadataItemRuleParams<Rule extends MetadataItemRule, PropertyType extends PropertyRuleType> = {
  propertyType: PropertyType
  itemRule: Rule
  schemaName?: string
}

export const defineMetadataItemRule = <
  Rule extends MetadataItemRule,
  PropertyType extends PropertyRuleType,
>(
  params: MetadataItemRuleParams<Rule, PropertyType>
): import("../definition").MetadataRulesDefinition<never> => {
  const { propertyType, itemRule } = params
  const schemaName = params.schemaName ?? itemRule.itemType
  const schemaExporter = ({ context }: { context: ConfigurationContext }) =>
    exportMetadataItemToJSONSchema({ context, rule: itemRule })

  return defineMetadataRules({
    ...emptyMetadataRules,
    metadataItems: { [itemRule.itemType]: itemRule },
    schemas: {
      [schemaName]: {
        source: itemRule,
        export: schemaExporter,
      },
    },
    propertyTypes: propertyTypesFromContributions([
      definePropertyTypeRule(propertyType, "importFromXMLToYAML", ({ context, rule, xml, name, traversal }) =>
        importMetadataItemFromXMLToYAML({
          context,
          rule: propertyItemRule(rule) ?? itemRule,
          xml,
          name,
          traversal,
        })
      ),
      definePropertyTypeRule(propertyType, "nestedItemRule", { itemRule }),
      definePropertyTypeRule(propertyType, "yamlToXMLNestedRule", {
        kind: "item",
        itemRule,
        itemRuleFromProperty: propertyItemRule,
      }),
      definePropertyTypeRule(propertyType, "resourceTopology", ({ propertyRule }) => {
        if (propertyRule?.filePath === undefined) return []
        return [
          {
            kind: "xmlDocument",
            assignmentProjectPattern: "",
            xmlPattern: propertyRule.filePath,
            role: "property",
            required: false,
            read: { inputRole: "property" },
            prepareCapabilityId: "itemProperty",
            source: { kind: "property", description: String(propertyType) },
          },
        ]
      }),
      definePropertyTypeRule(propertyType, "exportToJSONSchema", ({ context, rule }) => {
        const schemaStack = context.exportToJSONSchema?.schemaStack ?? []
        if (schemaStack.includes(propertyType)) return Type.Unknown()

        const resolvedItemRule = propertyItemRule(rule) ?? itemRule
        return exportMetadataItemToJSONSchema({
          context: withNestedJSONSchemaItemContext(context, resolvedItemRule, propertyType),
          rule: resolvedItemRule,
        })
      }),
    ]),
  })
}

export const registerMetadataItemRule = <
  Rule extends MetadataItemRule,
  PropertyType extends PropertyRuleType,
>(params: MetadataItemRuleParams<Rule, PropertyType>): void => {
  const definition = defineMetadataItemRule(params)
  registerLegacyPropertyTypeDefinitions(definition.propertyTypes)
  registerLegacySchemaDefinitions(definition, params.itemRule)
}

function propertyItemRule(propertyRule: import("../property/types").PropertyRule): MetadataItemRule | undefined {
  return propertyRule.itemRule as MetadataItemRule | undefined
}
