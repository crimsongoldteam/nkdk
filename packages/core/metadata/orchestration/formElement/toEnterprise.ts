import { ConfigurationContext, ContextElementToEnterprise } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { MetadataItemTypeToEnterprise, MetadataItemTypeToMdItem } from ".."
import { exportPropertiesToEnterprise } from "../property/toEnterprise"
import { getElementRule } from "./ruleFactory"
import { FormElementType } from "./types"

function pushElementToContext(params: {
  context: ConfigurationContext
  itemType: FormElementType
  element: NamedElement
}): ConfigurationContext {
  const { context, itemType, element } = params

  const elementsTree: ContextElementToEnterprise[] = []
  if (context.enterprise?.elementsTree !== undefined) {
    elementsTree.push(...context.enterprise.elementsTree)
  }

  const dataPath: string | undefined = "dataPath" in element ? (element.dataPath as string) : undefined
  elementsTree.push({ itemType: itemType, dataPath: dataPath })

  return {
    ...context,
    enterprise: {
      ...(context.enterprise ? context.enterprise : { prefix: "", attributes: {}, elementsTree: [] }),
      elementsTree: elementsTree,
    },
  }
}

export const exportElementToEnterprise = <Type extends FormElementType>(params: {
  context: ConfigurationContext
  itemType: Type
  value: MetadataItemTypeToMdItem<Type>
}): MetadataItemTypeToEnterprise<Type> => {
  const { context, itemType, value: element } = params

  const currentContext = pushElementToContext({ context, itemType, element })

  const rules = getElementRule(itemType)

  const properties = exportPropertiesToEnterprise({
    context: currentContext,
    metadataItem: element,
    rule: rules,
  })

  return {
    ...properties,
    ElementType: rules.enterpriseField,
    Name: element.name,
    ...(rules.enterpriseFieldType !== "None"
      ? { Type: { Type: "SystemEnumeration", Value: rules.enterpriseFieldType } }
      : {}),
  }
}
