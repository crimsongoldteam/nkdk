import { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule } from "../property/types"
import { importMetadataItemFromYAML } from "../metadataItem/fromYAML"
import { ToMetadata, ToYAML } from "../metadataItem/registry"
import { toYAMLImportError, withYAMLImportDiagnostics } from "../yamlImportError"

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
  source?: ToMetadata<Rule["itemType"]>[]
  keyField?: keyof Rule["properties"]
}): ToMetadata<Rule["itemType"]>[] | undefined => {
  const { context, itemRule, yaml, source, keyField } = params

  if (yaml == undefined || yaml.length === 0) return undefined

  const result: ToMetadata<Rule["itemType"]>[] = []
  for (const [index, item] of yaml.entries()) {
    const itemSource = findSourceItem({
      itemRule,
      yaml: item,
      source,
      keyField,
      index,
    })
    const itemContext = withYAMLImportDiagnostics(context, {
      propertyPath: [`[${index}]`],
      yamlPath: [`[${index}]`],
    })
    let itemMetadata: ToMetadata<Rule["itemType"]> | undefined
    try {
      itemMetadata = importMetadataItemFromYAML({
        context: itemContext,
        rule: itemRule,
        yaml: item,
        source: itemSource,
      }) as ToMetadata<Rule["itemType"]> | undefined
    } catch (error) {
      throw toYAMLImportError(error, itemContext)
    }
    if (itemMetadata == undefined) continue
    result.push(itemMetadata)
  }

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

  const result: ToMetadata<Rule["itemType"]>[] = []
  for (const [key, value] of Object.entries(yaml)) {
    const name = nameFromYAMLKey !== undefined ? nameFromYAMLKey(key) : key
    const itemContext = withYAMLImportDiagnostics(context, {
      propertyPath: [key],
      yamlPath: [key],
    })
    let item: ToMetadata<Rule["itemType"]> | undefined
    try {
      item = importMetadataItemFromYAML({
        context: itemContext,
        rule: itemRule,
        yaml: value,
        name,
      })
    } catch (error) {
      throw toYAMLImportError(error, itemContext)
    }
    if (item == undefined) continue
    result.push({ ...item, name } as ToMetadata<Rule["itemType"]>)
  }

  return result.length > 0 ? result : undefined
}

const findSourceItem = <Rule extends MetadataItemRule>(params: {
  itemRule: Rule
  yaml: ToYAML<Rule["itemType"]>
  source: ToMetadata<Rule["itemType"]>[] | undefined
  keyField: keyof Rule["properties"] | undefined
  index: number
}): ToMetadata<Rule["itemType"]> | undefined => {
  const { itemRule, yaml, source, keyField, index } = params
  if (source === undefined) return undefined
  if (keyField === undefined) return source[index]

  const keyRule = itemRule.properties[keyField as string]
  const yamlKey = keyRule?.yaml
  if (yamlKey === undefined || yaml === undefined || yaml === null || typeof yaml !== "object") return source[index]

  const yamlValue = (yaml as Record<string, unknown>)[yamlKey]
  const sourceItem = source.find((item) => item[keyField as keyof typeof item] === yamlValue)
  return sourceItem ?? source[index]
}
