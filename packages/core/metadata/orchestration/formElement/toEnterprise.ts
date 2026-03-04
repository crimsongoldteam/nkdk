import { ConfigurationContext, ContextElementToEnterprise } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { getElementRule } from "../../metadataFactory/elements/ruleFactory"
import { FormElementType } from "../../metadataFactory/metadataType/types"
import { ToEnterprise } from "../../metadataFactory/rules"
import { exportPropertiesToEnterprise } from "../property/toEnterprise"

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

export const exportElementToEnterprise = <T extends NamedElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  value: T
}): ToEnterprise<T> => {
  const { context, itemType, value: element } = params

  const currentContext = pushElementToContext({ context, itemType, element })

  const rules = getElementRule(itemType)

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
