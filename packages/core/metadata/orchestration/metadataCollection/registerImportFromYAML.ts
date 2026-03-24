import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { importMetadataItemFromYAML } from "../metadataItem/fromYAML"
import { ToMetadata, ToYAML } from "../metadataItem/registry"
import { NamedMetadataItem } from "./types"

export const registerImportFromYAML = <Rule extends MetadataItemRule, CollectionType extends PropertyRuleType>(
  propertyType: CollectionType,
  itemRule: Rule,
  nameFromYAMLKey?: (yamlKey: string) => string,
  returnUndefinedWhenEmptyYAML?: boolean
): void => {
  registerTypeRule(
    propertyType,
    "importFromYAML",
    (
      context: ConfigurationContext,
      _rule: PropertyRule | undefined,
      yaml: Record<string, ToYAML<Rule["itemType"]> | undefined> | undefined
    ): (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[] | undefined => {
      if (!yaml) return returnUndefinedWhenEmptyYAML ? undefined : []

      const imported = Object.entries(yaml).flatMap(([name, value]) => {
        if (!value) return []
        const mappedName = nameFromYAMLKey ? nameFromYAMLKey(name) : name
        const properties = importMetadataItemFromYAML({
          context,
          yaml: value,
          rule: itemRule,
          name: mappedName,
        })
        return [{ ...properties, name: mappedName } as ToMetadata<Rule["itemType"]> & NamedMetadataItem]
      })

      if (imported.length === 0 && returnUndefinedWhenEmptyYAML) return undefined
      return imported
    }
  )
}
