import { ConfigurationContext, ContextElementToEnterprise } from "~/metadata/context/types"
import { exportDataPathToEnterprise } from "~/metadata/forms/commonObjects/dataPath/toEnterprise"
import { ToEnterprise, ToMetadata } from ".."
import { exportPropertiesToEnterprise } from "../property/toEnterprise"
import { getElementRule } from "./ruleFactory"
import { CollectableElementType } from "./types"

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
      ...(context.enterprise ? context.enterprise : { prefix: "", attributes: {}, elementsTree: [] }),
      elementsTree: elementsTree,
    },
  }
}

export const exportElementToEnterprise = <Type extends CollectableElementType>(params: {
  context: ConfigurationContext
  value: ToMetadata<Type>
}): ToEnterprise<Type> => {
  const { context, value: element } = params
  const itemType = element.itemType

  const rules = getElementRule(itemType)

  let dataPathEnterprise: string | undefined = undefined
  let dataPath: string | undefined = undefined
  if ("dataPath" in element) {
    dataPath = element.dataPath
    const dataPathRule = rules.properties.dataPath
    dataPathEnterprise = exportDataPathToEnterprise({
      context: context,
      rule: dataPathRule,
      value: dataPath,
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
    Name: element.name,
    ...(rules.enterpriseFieldType !== "None"
      ? { Type: { Type: "SystemEnumeration", Value: rules.enterpriseFieldType } }
      : {}),
  } as ToEnterprise<Type>
}
