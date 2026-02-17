import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import { ToTypedYAML, ToYAML } from "~/metadata/metadataFactory/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { PropertyRule } from "../../elements/calendarField/rules"
import { AllChildItem, AllChildItemsPartialEnterprise, TypedElement } from "./types"

export const importChildItemsFromPartialYAML = <To extends AllChildItem>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  _data: undefined,
  childItems: To[]
): To[] => {
  const childItemsProperties = context.allElements!

  return childItems.map((item) => {
    const processedItem = importChildItemProperties(context, item, childItemsProperties)

    return processedItem
  })
}

export const importChildItemsTypedFromEnterprise = <To extends TypedElement>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  allProperties?: Record<string, ToTypedYAML<To>>
): To[] => {
  if (!allProperties) return []

  const result: To[] = []
  for (const [name, item] of Object.entries(allProperties)) {
    const resultItem = importElementFromTypedYAML({ context: context, yaml: item, name: name })!
    result.push(resultItem)
  }
  return result
}

const importChildItemProperties = <To extends AllChildItem>(
  context: ConfigurationContext,
  item: To,
  allProperties: AllChildItemsPartialEnterprise
): To => {
  const propertiesEnterprise = allProperties[item.name]

  const result = importElementFromPartialYAML({
    context: context,
    itemType: item.itemType,
    yaml: propertiesEnterprise as ToYAML<To> | undefined,
    source: item,
  })!

  return result as To
}

registerTypeRule("ChildItems", "importFromEnterprise", importChildItemsTypedFromEnterprise)
