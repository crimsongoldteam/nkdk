import { ConfigurationContextFromXML } from "../../../context/types"
import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { withConfigurationIndexYamlCollectionItemContext } from "../../../configurationIndex/collector/context"
import { importPropertyFromXML, exportPropertyToXML } from "../../../orchestration"
import type { ParameterValueXML, SettingsParameterValue } from "../parameterValue/types"
import { getSettingsParameterValueRuleForParameter } from "./ruleSet"
import type { SettingsParameterValueCollectionXML, SettingsParameterValueRuleSet } from "./types"

export const asDcscorItemArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

const normalizeDcscorItemsInput = (
  xml: SettingsParameterValueCollectionXML | ParameterValueXML[] | ParameterValueXML | undefined
): ParameterValueXML[] => {
  if (xml === undefined) return []
  if (Array.isArray(xml)) return xml
  if ("dcscor:item" in (xml as object)) {
    return asDcscorItemArray((xml as SettingsParameterValueCollectionXML)["dcscor:item"])
  }
  // Единичный `dcscor:item`, уже раскрытый родителем через `xmlParents`.
  return [xml as ParameterValueXML]
}

export const importSettingsParameterValueDcscorItemsFromXML = (params: {
  context: ConfigurationContextFromXML
  ruleSet: SettingsParameterValueRuleSet
  /** Корень `{ dcscor:item }` или уже массив элементов (как из `getXMLValue` при `xmlParents`). */
  xml: SettingsParameterValueCollectionXML | ParameterValueXML[] | undefined
  /** Если true — элементы без правила в наборе пропускаются (оформление полей). */
  skipUnknownParameters: boolean
}): Record<string, SettingsParameterValue> | undefined => {
  const { context, ruleSet, xml, skipUnknownParameters } = params

  const items = normalizeDcscorItemsInput(xml)
  const parameters: Record<string, SettingsParameterValue> = {}

  for (const itemXml of items) {
    const parameterName = itemXml["dcscor:parameter"]
    if (typeof parameterName !== "string") continue

    const itemRule = getSettingsParameterValueRuleForParameter(ruleSet, parameterName)
    if (itemRule === undefined) {
      if (skipUnknownParameters) continue
      continue
    }

    const itemContext = withConfigurationIndexYamlCollectionItemContext(context, {
      index: Object.keys(parameters).length,
      yamlKey: parameterName,
    })

    const value = importPropertyFromXML({
      context: itemContext,
      rule: itemRule,
      value: itemXml,
    }) as SettingsParameterValue | undefined

    if (value !== undefined) {
      parameters[parameterName] = value
    }
  }

  return Object.keys(parameters).length > 0 ? parameters : undefined
}

export const exportSettingsParameterValueDcscorItemsToXML = (params: {
  context: ConfigurationContextWithExportToXML
  ruleSet: SettingsParameterValueRuleSet
  parameters: Record<string, SettingsParameterValue>
  referenceParameters?: Record<string, SettingsParameterValue>
  /** Если задан — только эти имена и в этом порядке (например оформление полей). */
  orderedParameterNames?: string[]
}): SettingsParameterValueCollectionXML | undefined => {
  const { context, ruleSet, parameters, referenceParameters, orderedParameterNames } = params

  const names =
    orderedParameterNames !== undefined
      ? orderedParameterNames.filter((n) => parameters[n] !== undefined)
      : Object.keys(parameters)

  const items: ParameterValueXML[] = []

  for (const parameterName of names) {
    const fieldValue = parameters[parameterName]
    if (fieldValue === undefined) continue

    const itemRule = getSettingsParameterValueRuleForParameter(ruleSet, parameterName)
    if (itemRule === undefined) continue

    const referenceField = referenceParameters?.[parameterName]
    const itemXml = exportPropertyToXML({
      context,
      rule: itemRule,
      value: fieldValue,
      referenceMetadata: referenceField,
    })
    if (itemXml !== undefined) {
      items.push(itemXml as ParameterValueXML)
    }
  }

  if (items.length === 0) return undefined

  return {
    "dcscor:item": items.length === 1 ? items[0]! : items,
  }
}

/** Для свойства с `xmlParents` в `setXMLValue` подставляется только значение `dcscor:item`, без обёртки. */
export const getDcscorItemExportValueForXmlParents = (
  wrapped: SettingsParameterValueCollectionXML | undefined
): ParameterValueXML | ParameterValueXML[] | undefined => {
  if (!wrapped) return undefined
  const items = asDcscorItemArray(wrapped["dcscor:item"])
  if (items.length === 0) return undefined
  return items.length === 1 ? items[0]! : items
}
