import { ConfigurationContext } from "~/metadata/context/types"
import {
  ChildItemsPropertyRule,
  importElementFromPartialYAML,
  importElementFromTypedYAML,
  ImportFromYAMLFunctionNew,
  ToMetadata,
  ToTypedYAML,
  ToYAML,
  TypedFormElementType,
} from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "../../elements/calendarField/rules"
import { ChildItem, FormElementsYAML, TypedElement } from "./types"

// Typed
export const importChildItemsFromYAML: ImportFromYAMLFunctionNew = <To extends ChildItem>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: ToYAML<To["itemType"]>[]
  value?: ToYAML<To["itemType"]>[]
  source?: To[]
}): To[] => {
  const { rule, source } = params

  const narrowRule = rule as ChildItemsPropertyRule

  if (narrowRule.fromPartialYAML) {
    return importChildItemsFromPartialYAML({
      context: params.context,
      rule: params.rule,
      source: params.source,
    })
  }

  const value = params.value
  if (!value || typeof value !== "object") {
    return [] as To[]
  }

  type TypedItemType = Extract<To["itemType"], TypedFormElementType>
  const typedYAML = value as unknown as ToTypedYAML<TypedItemType>

  if (source && source.length > 0) throw new Error("Source is not empty! Move child items to yaml")

  return importChildItemsTypedFromYAML({
    context: params.context,
    rule: params.rule,
    yaml: typedYAML as ToTypedYAML<TypedElement["itemType"]>,
  }) as To[]
}

export const importChildItemsFromPartialYAML = <To extends ChildItem>(params: {
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
  yaml?: ToTypedYAML<To["itemType"]>
}): ToMetadata<To["itemType"]>[] => {
  const { context, yaml } = params

  if (!yaml) return []

  const result: ToMetadata<To["itemType"]>[] = []
  for (const [name, item] of Object.entries(yaml)) {
    const resultItem = importElementFromTypedYAML({
      context: context,
      yaml: item,
      name: name,
    })!
    result.push(resultItem)
  }
  return result
}

const importChildItemProperties = <To extends ChildItem>(
  context: ConfigurationContext,
  item: To,
  allElements: FormElementsYAML
): To => {
  const propertiesYAML = allElements[item.name] as ToYAML<To["itemType"]>
  const source = dropSyntheticTableLabelDataPath({ item, propertiesYAML })

  const result = importElementFromPartialYAML({
    context: context,
    itemType: source.itemType,
    yaml: propertiesYAML,
    source,
  })!

  return result as To
}

const dropSyntheticTableLabelDataPath = <To extends ChildItem>(params: {
  item: To
  propertiesYAML: ToYAML<To["itemType"]> | undefined
}): To => {
  const { item, propertiesYAML } = params

  if (item.itemType !== "TableLabelField") return item
  if (!("dataPath" in item)) return item
  if (item.dataPath !== item.name) return item
  if (propertiesYAML && typeof propertiesYAML === "object" && "ПутьКДанным" in propertiesYAML) return item

  const result = { ...item }
  delete (result as { dataPath?: string }).dataPath
  return result
}

registerTypeRule("GroupChildItems", "importFromYAML", importChildItemsFromYAML)
registerTypeRule("CommandBarChildItems", "importFromYAML", importChildItemsFromYAML)
registerTypeRule("TableChildItems", "importFromYAML", importChildItemsFromYAML)
registerTypeRule("PagesChildItems", "importFromYAML", importChildItemsFromYAML)
