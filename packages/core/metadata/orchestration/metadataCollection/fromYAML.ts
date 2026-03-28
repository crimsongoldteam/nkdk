import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { importMetadataItemFromYAML } from "../metadataItem/fromYAML"
import { ToMetadata, ToYAML } from "../metadataItem/registry"

export type MetadataCollectionImportFromYAMLOptions = {
  /** Преобразование ключа объекта YAML (или индекса в массиве) во внутреннее `name` элемента коллекции */
  nameFromYAMLKey?: (yamlKey: string) => string
  /** YAML — массив элементов */
  yamlAsArray?: true
}

export const importMetadataItemCollectionFromYAMLAsArray = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  itemRule: Rule
  yaml: ToYAML<Rule["itemType"]>[] | undefined
}): ToMetadata<Rule["itemType"]>[] | undefined => {
  const { context, itemRule, yaml } = params

  if (yaml == undefined || yaml.length === 0) return undefined

  const result = yaml.map((item) => {
    return importMetadataItemFromYAML({ context, rule: itemRule, yaml: item })
  })

  return result.length > 0 ? result : undefined
}

export const importMetadataItemCollectionFromYAMLAsRecord = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  itemRule: Rule
  yaml: Record<string, ToYAML<Rule["itemType"]>> | undefined
  nameFromYAMLKey?: (yamlKey: string) => string
}): ToMetadata<Rule["itemType"]>[] | undefined => {
  const { context, itemRule, yaml, nameFromYAMLKey } = params

  if (yaml == undefined) return undefined

  const result = Object.entries(yaml).map(([key, value]) => {
    const name = nameFromYAMLKey !== undefined ? nameFromYAMLKey(key) : key
    const item = importMetadataItemFromYAML({
      context,
      rule: itemRule,
      yaml: value,
      name,
    })
    // Ключ записи в YAML — имя элемента коллекции (реквизит, команда и т.д.)
    return { ...item, name } as ToMetadata<Rule["itemType"]>
  })

  return result.length > 0 ? result : undefined
}
