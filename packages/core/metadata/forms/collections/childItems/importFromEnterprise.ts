import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { importFormElementTypeFromEnterprise, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { AllChildItem, AllChildItemsPartialEnterprise, CommandBarChildItem } from "./types"

export const importChildItemsPartialFromEnterprise = <To extends AllChildItem>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  childItems: To[]
): To[] => {
  const childItemsProperties = context.allElements!

  return childItems.map((item) => {
    const processedItem = importChildItemProperties(context, rule, item, childItemsProperties)

    if ("childItems" in processedItem && processedItem.childItems && processedItem.childItems.length > 0) {
      processedItem.childItems = importChildItemsPartialFromEnterprise(
        context,
        undefined,
        processedItem.childItems as To[]
      ) as typeof processedItem.childItems
    }

    if ("autoCommandBar" in processedItem && processedItem.autoCommandBar?.childItems?.length) {
      processedItem.autoCommandBar = {
        ...processedItem.autoCommandBar,
        childItems: importChildItemsPartialFromEnterprise(
          context,
          undefined,
          processedItem.autoCommandBar.childItems as To[]
        ) as CommandBarChildItem[],
      }
    }

    return processedItem
  })
}

export const importChildItemsTypedFromEnterprise = <To extends AllChildItem>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  allProperties?: Record<string, ToTypedEnterpriseType<To>>
): To[] => {
  if (!allProperties) return []

  const result: To[] = []
  for (const [name, item] of Object.entries(allProperties)) {
    const elementType = importFormElementTypeFromEnterprise(context, undefined, item.Тип)
    const fn = getOperationFunction("ImportTypedFromEnterprise", elementType)
    if (fn == undefined)
      throw new Error(`ImportTypedFromEnterprise function not found for element type: ${elementType}`)
    const resultItem = fn(context, item, name) as NonNullable<To>
    result.push(resultItem)
  }
  return result
}

const importChildItemProperties = <To extends AllChildItem>(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  item: To,
  allProperties: AllChildItemsPartialEnterprise
): To => {
  const propertiesEnterprise = allProperties[item.name]

  const fn = getOperationFunction("ImportPartialFromEnterprise", item.elementType)
  if (fn == undefined)
    throw new Error(`ImportPartialFromEnterprise function not found for element type: ${item.elementType}`)
  const result = fn(context, item, propertiesEnterprise)

  return result as To
}

// registerTypeRule("ChildItems", "importFromEnterprise", importChildItemsPartialFromEnterprise)
registerTypeRule("ChildItems", "importFromEnterprise", importChildItemsPartialFromEnterprise)
