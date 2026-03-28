import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { ToMetadata, ToYAML } from "../metadataItem/registry"
import { exportPropertiesToYAML } from "../property/toYAML"
import { NamedMetadataItem } from "./types"

export const registerExportToYAML = <Rule extends MetadataItemRule, CollectionType extends PropertyRuleType>(
  propertyType: CollectionType,
  itemRule: Rule,
  yamlKeyFromName?: (name: string) => string,
  yamlAsArray?: true
): void => {
  registerTypeRule(
    propertyType,
    "exportToYAML",
    (
      context: ConfigurationContext,
      _rule: PropertyRule | undefined,
      data: (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[] | undefined
    ): Record<string, ToYAML<Rule["itemType"]>> | ToYAML<Rule["itemType"]>[] | undefined => {
      if (!data || data.length === 0) return undefined

      if (yamlAsArray) {
        return data.map(
          (item) => (exportPropertiesToYAML({ context, data: item, rule: itemRule }) ?? {}) as ToYAML<Rule["itemType"]>
        )
      }

      return Object.fromEntries(
        data.map((item) => [
          yamlKeyFromName ? yamlKeyFromName(item.name) : item.name,
          (exportPropertiesToYAML({ context, data: item, rule: itemRule }) ?? {}) as ToYAML<Rule["itemType"]>,
        ])
      )
    }
  )
}
