import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { ToMetadata, ToYAML } from "./registry"
import { exportMetadataItemToYAML } from "./toYAML"

export const registerExportToYAML = <Rule extends MetadataItemRule>(
  propertyType: PropertyRuleType,
  itemRule: Rule
): void => {
  registerTypeRule(
    propertyType,
    "exportToYAML",
    (params: {
      context: ConfigurationContext
      rule: PropertyRule
      value: unknown
      name?: string
    }): ToYAML<Rule["itemType"]> | undefined => {
      // Прокидываем имя родителя (например, имя реквизита формы) в контекст,
      // чтобы при экспорте вложенных свойств с externalFile был доступен parentName.
      const context =
        params.name && params.context.exportToYAML
          ? {
              ...params.context,
              exportToYAML: {
                ...params.context.exportToYAML,
                parent: { name: params.name },
              },
            }
          : params.context

      const value =
        params.name && params.value !== undefined && params.value !== null && typeof params.value === "object"
          ? { ...(params.value as Record<string, unknown>), name: params.name }
          : params.value

      return exportMetadataItemToYAML({
        context,
        data: value as ToMetadata<Rule["itemType"]> | undefined,
        rule: itemRule,
      })
    }
  )
}
