import { ConfigurationContext, ContextElementToEnterprise } from "@nkdk/runtime"
import { ToEnterprise, ToMetadata } from "../metadataItem/registry"
import { exportPropertiesToEnterprise } from "../property/toEnterprise"
import { exportFormElementDataPath } from "./registry"
import { getElementRule } from "./ruleFactory"
import { CollectableElementType } from "./types"

export const exportElementToEnterprise = <Type extends CollectableElementType>(params: {
  context: ConfigurationContext
  value: ToMetadata<Type>
}): ToEnterprise<Type> => {
  const { context, value: element } = params
  const itemType = element.itemType

  const rules = getElementRule(itemType)

  let dataPathEnterprise: string | undefined = undefined
  let dataPath: string | undefined = undefined
  if ("dataPath" in element && typeof element.dataPath === "string") {
    const elementDataPath = element.dataPath
    dataPath = elementDataPath
    const dataPathRule = rules.properties.dataPath
    dataPathEnterprise = exportFormElementDataPath({
      context: context,
      rule: dataPathRule,
      value: elementDataPath,
    })
  }

  const currentContext =
    dataPath !== undefined && dataPathEnterprise !== undefined
      ? pushElementToContextToEnterprise({ context, itemType, dataPath, dataPathEnterprise })
      : pushElementToContextToEnterprise({
          context,
          itemType,
          dataPath: undefined,
          dataPathEnterprise: undefined,
        })

  const properties = exportPropertiesToEnterprise({
    context: currentContext,
    metadataItem: element,
    rule: rules,
  })

  return {
    ...(dataPathEnterprise ? { DataPath: dataPathEnterprise } : {}),
    ...properties,
    ElementType: rules.enterpriseField,
    Name: getElementName(context, element),
    ...(rules.enterpriseFieldType !== "None"
      ? { Type: { Type: "SystemEnumeration", Value: rules.enterpriseFieldType } }
      : {}),
  } as ToEnterprise<Type>
}

const getElementName = (context: ConfigurationContext, element: ToMetadata<CollectableElementType>): string => {
  const prefix = context.enterprise?.prefix ?? ""
  const base = prefix + element.name
  const existingNames = (context.enterprise?.allElementsNames ?? []).map((n) => n.toLowerCase())
  if (!existingNames.includes(base.toLowerCase())) {
    return base
  }
  let counter = 1
  while (existingNames.includes((base + counter).toLowerCase())) {
    counter++
  }

  const result = base + counter

  context.enterprise?.allElementsNames.push(result)
  return result
}

function pushElementToContextToEnterprise(params: {
  context: ConfigurationContext
  itemType: CollectableElementType
  dataPath: string
  dataPathEnterprise: string
}): ConfigurationContext
function pushElementToContextToEnterprise(params: {
  context: ConfigurationContext
  itemType: CollectableElementType
  dataPath: undefined
  dataPathEnterprise: undefined
}): ConfigurationContext
function pushElementToContextToEnterprise(params: {
  context: ConfigurationContext
  itemType: CollectableElementType
  dataPath: string | undefined
  dataPathEnterprise: string | undefined
}): ConfigurationContext {
  const { context, itemType, dataPathEnterprise, dataPath } = params

  const elementsTree: ContextElementToEnterprise[] = []
  if (context.enterprise?.elementsTree !== undefined) {
    elementsTree.push(...context.enterprise.elementsTree)
  }

  elementsTree.push(
    dataPath !== undefined && dataPathEnterprise !== undefined
      ? { itemType, dataPath, dataPathEnterprise }
      : { itemType, dataPath: undefined, dataPathEnterprise: undefined }
  )

  return {
    ...context,
    enterprise: {
      ...(context.enterprise
        ? context.enterprise
        : { prefix: "", attributes: {}, elementsTree: [], allElementsNames: [] }),
      elementsTree: elementsTree,
    },
  }
}
