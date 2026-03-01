import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { FormElementType } from "../metadataType/types"
import { exportPropertiesToEnterprise } from "../properties/toEnterprise"
import { ToEnterprise } from "../rules"
import { getElementRule } from "./ruleFactory"

export const exportElementToEnterprise = <T extends NamedElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  value: T
}): ToEnterprise<T> => {
  const { context, itemType, value: element } = params

  const elementsTree: ConfigurationContext["elementsTree"] = []
  if (context.elementsTree !== undefined) {
    elementsTree.push(...context.elementsTree)
  }

  elementsTree.push({ name: element.name, itemType: itemType })

  const currentContext: ConfigurationContext = {
    ...context,
    elementsTree: elementsTree,
  }

  const rules = getElementRule<T>(itemType)

  const properties = exportPropertiesToEnterprise({
    context: currentContext,
    metadataItem: element,
    rule: rules,
  })

  const result = {
    ...properties,
    ElementType: rules.enterpriseField,
    Name: element.name,
    ...(rules.enterpriseFieldType !== "None"
      ? { Type: { Type: "SystemEnumeration", Value: rules.enterpriseFieldType } }
      : {}),
  } satisfies ToEnterprise<T>

  return result
}
