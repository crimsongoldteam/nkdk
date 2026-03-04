import { ConfigurationContext } from "~/metadata/context/types"
import {
  ChildItemsPropertyRule,
  importElementFromPartialYAML,
  importElementFromTypedYAML,
  ImportFromYAMLFunctionNew,
  MetadataItem,
} from "~/metadata/metadataFactory"
import { ToTypedYAML, ToYAML } from "~/metadata/metadataFactory/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "../../elements/calendarField/rules"
import { AllChildItem, AllChildItemsPartialYAML, TypedElement } from "./types"

export const importChildItemsFromYAML: ImportFromYAMLFunctionNew = <To extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: unknown
  value?: ToYAML<To> | ToTypedYAML<To>[]
  source?: To[]
}): To[] => {
  const { rule, source } = params

  const narrowRule = rule as ChildItemsPropertyRule

  if (narrowRule.fromPartialYAML) {
    return importChildItemsFromPartialYAML({
      context: params.context,
      rule: params.rule,
      source: params.source as unknown as AllChildItem[] | undefined,
    }) as unknown as To[]
  }

  if (source && source.length > 0) throw new Error("Source is not empty! Move child items to yaml")

  return importChildItemsTypedFromYAML({
    context: params.context,
    rule: params.rule,
    yaml: params.value as ToTypedYAML<To> | undefined,
  }) as unknown as To[]
}

export const importChildItemsFromPartialYAML = <To extends AllChildItem>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  source?: To[]
}): To[] => {
  const { context, source } = params

  if (!source) return []

  const childItemsProperties = context.allElements ?? {}

  return source.map((item) => {
    const processedItem = importChildItemProperties(context, item, childItemsProperties)

    return processedItem
  })
}

const importChildItemsTypedFromYAML = <To extends TypedElement>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: ToTypedYAML<To>
}): To[] => {
  const { context, yaml } = params

  if (!yaml) return []

  const result: To[] = []
  for (const [name, item] of Object.entries(yaml)) {
    const resultItem = importElementFromTypedYAML({
      context: context,
      yaml: item as ToTypedYAML<To> & { События?: Record<string, string> },
      name: name,
    })!
    result.push(resultItem)
  }
  return result
}

const importChildItemProperties = <To extends AllChildItem>(
  context: ConfigurationContext,
  item: To,
  allProperties: AllChildItemsPartialYAML
): To => {
  const propertiesYAML = allProperties[item.name]

  const result = importElementFromPartialYAML({
    context: context,
    itemType: item.itemType,
    yaml: propertiesYAML as ToYAML<To> | undefined,
    source: item,
  })!

  return result as To
}

registerTypeRule("ChildItems", "importFromYAML", importChildItemsFromYAML)
