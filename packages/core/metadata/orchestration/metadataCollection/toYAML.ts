import { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule } from "../property/types"
import { ToMetadata, ToYAML } from "../metadataItem/registry"
import { exportPropertiesToYAML } from "../property/toYAML"
import type { NamedMetadataItem } from "./types"

export const exportMetadataCollectionToYAMLAsArray = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: ToMetadata<Rule["itemType"]>[] | undefined
  itemRule: Rule
}): ToYAML<Rule["itemType"]>[] | undefined => {
  const { context, data, itemRule } = params
  if (!data || data.length === 0) return undefined

  return data.map(
    (item) => (exportPropertiesToYAML({ context, data: item, rule: itemRule }) ?? {}) as ToYAML<Rule["itemType"]>
  )
}

export const exportMetadataCollectionToYAMLAsRecord = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[] | undefined
  itemRule: Rule
  keyField: keyof Rule["properties"]
  /** Ключ записи в YAML-объекте коллекции; по умолчанию — строковое значение item[keyField] */
  recordYamlKeyFromItem?: (item: ToMetadata<Rule["itemType"]> & NamedMetadataItem) => string
}): Record<string, ToYAML<Rule["itemType"]>> | undefined => {
  const { context, data, itemRule, keyField, recordYamlKeyFromItem } = params
  if (!data || data.length === 0) return undefined

  return Object.fromEntries(
    data.map((item) => {
      const yamlEntryKey =
        recordYamlKeyFromItem !== undefined
          ? recordYamlKeyFromItem(item)
          : String((item as Record<string, unknown>)[keyField as string])
      return [
        yamlEntryKey,
        (exportPropertiesToYAML({ context, data: item, rule: itemRule }) ?? {}) as ToYAML<Rule["itemType"]>,
      ]
    })
  )
}
