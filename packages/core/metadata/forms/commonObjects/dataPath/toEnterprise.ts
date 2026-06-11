import { getCurrentTableFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext, ContextElementToEnterprise } from "~/metadata/context/types"
import { DataPathPropertyRule, PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { EnterpriseAttributeMapItem } from "../../clientApplicationForm/types"

export const exportDataPathToEnterprise = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value?: string
}): string | undefined => {
  const { context, rule, value } = params

  if (!value) return undefined

  const dataPathRule = rule as DataPathPropertyRule

  const enterprise = context.enterprise!

  const parentTable = getCurrentTableFromContext(context)

  const title = value.split(".").pop() ?? value

  const attributeName = getAttributeName({ context, value, parentTable })

  const dataPath = parentTable ? `${parentTable.dataPathEnterprise}.${attributeName}` : attributeName

  const attribute: EnterpriseAttributeMapItem = {
    name: attributeName,
    title: title,
    type: { Type: [dataPathRule.defaultType ?? "string"] },
    ...(parentTable ? { path: parentTable.dataPathEnterprise } : {}),
  }

  enterprise.attributes[value.toLowerCase()] = attribute

  return dataPath
}

const getAttributeName = (params: {
  context: ConfigurationContext
  value: string
  parentTable: ContextElementToEnterprise | undefined
}): string => {
  const { context, value, parentTable } = params
  const prefix = context.enterprise!.prefix
  const withoutTable = parentTable ? value.slice(parentTable.dataPath!.length + 1) : value

  const withoutDot = withoutTable.replace(/\./g, "")

  const withPrefix = (parentTable ? "" : prefix) + withoutDot

  const result = withPrefix + getAttributeNumberSuffix(context, withPrefix, parentTable?.dataPathEnterprise)

  return result
}

const getAttributeNumberSuffix = (
  context: ConfigurationContext,
  attributeName: string,
  parentPathEnterprise: string | undefined
): string => {
  const enterprise = context.enterprise!
  const existingNames = Object.values(enterprise.attributes)
    .filter((attr) => (attr.path ?? undefined) === parentPathEnterprise)
    .map((attr) => attr.name.toLowerCase())
  const base = attributeName.toLowerCase()
  if (!existingNames.includes(base)) return ""
  let counter = 1
  while (existingNames.includes(base + counter)) {
    counter++
  }
  return String(counter)
}

registerTypeRule("DataPath", "exportToEnterprise", exportDataPathToEnterprise)
