import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { importMetadataItemFromYAML } from "./fromYAML"
import { ToMetadata, ToYAML } from "./registry"

export const registerImportFromYAML = <Rule extends MetadataItemRule>(
  propertyType: PropertyRuleType,
  itemRule: Rule
): void => {
  registerTypeRule(
    propertyType,
    "importFromYAML",
    (params: {
      context: ConfigurationContext
      rule: PropertyRule
      yaml?: unknown
      source?: unknown
      value: unknown
      name?: string
    }): ToMetadata<Rule["itemType"]> | undefined => {
      if (params.value == null && params.source == null) {
        return undefined
      }
      // Прокидываем имя родителя в контекст импорта (аналогично registerExportToYAML),
      // чтобы при импорте вложенных свойств с externalFile был доступен parent.name.
      const context =
        params.name && params.context.importFromYAML
          ? {
              ...params.context,
              importFromYAML: {
                ...params.context.importFromYAML,
                parent: { name: params.name },
              },
            }
          : params.context

      return importMetadataItemFromYAML({
        context,
        yaml: params.value as ToYAML<Rule["itemType"]> | undefined,
        rule: itemRule,
        source: params.source as ToMetadata<Rule["itemType"]> | undefined,
        name: params.name,
      })
    }
  )
}
