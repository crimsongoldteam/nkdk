import { ConfigurationContext, ContextElementToEnterprise } from "~/metadata/context/types"
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

  const elementsTree: ContextElementToEnterprise[] = []
  if (context.enterprise?.elementsTree !== undefined) {
    elementsTree.push(...context.enterprise.elementsTree)
  }

  const dataPath: string | undefined = "dataPath" in element ? (element.dataPath as string) : undefined
  elementsTree.push({ itemType: itemType, dataPath: dataPath })

  const currentContext: ConfigurationContext = {
    ...context,
    enterprise: {
      ...(context.enterprise ? context.enterprise : { prefix: "", attributes: {}, elementsTree: [] }),
      elementsTree: elementsTree,
    },
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
