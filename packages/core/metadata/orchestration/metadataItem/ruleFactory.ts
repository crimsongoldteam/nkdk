import { Type } from "typebox"
import { registerJSONSchemaIdentity } from "../jsonSchemaRefs"
import { PropertyRuleType } from "../property/registry"
import type { MetadataItemRule } from "../property/types"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { importMetadataItemFromXMLToYAML } from "./fromXMLToYAML"
import { exportMetadataItemToJSONSchema } from "./toJSONSchema"

type MetadataItemRuleParams<Rule extends MetadataItemRule, PropertyType extends PropertyRuleType> = {
  propertyType: PropertyType
  itemRule: Rule
  schemaName?: string
}

export const registerMetadataItemRule = <Rule extends MetadataItemRule, PropertyType extends PropertyRuleType>(
  params: MetadataItemRuleParams<Rule, PropertyType>
): void => {
  const { propertyType, itemRule } = params
  const schemaName = params.schemaName ?? itemRule.itemType

  registerJSONSchemaIdentity({
    name: schemaName,
    source: itemRule,
    exporter: ({ context }) => exportMetadataItemToJSONSchema({ context, rule: itemRule }),
  })

  registerTypeRule(propertyType, "importFromXMLToYAML", ({ context, xml, name, traversal }) =>
    importMetadataItemFromXMLToYAML({ context, rule: itemRule, xml, name, traversal })
  )
  registerTypeRule(propertyType, "nestedItemRule", { itemRule })
  registerTypeRule(propertyType, "yamlToXMLNestedRule", { kind: "item", itemRule })
  registerTypeRule(propertyType, "resourceTopology", ({ propertyRule }) => {
    if (propertyRule?.filePath === undefined) return []
    return [
      {
        kind: "xmlDocument",
        assignmentProjectPattern: "",
        xmlPattern: propertyRule.filePath,
        role: "property",
        required: false,
        read: { inputRole: "property" },
        source: { kind: "property", description: String(propertyType) },
      },
    ]
  })
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
