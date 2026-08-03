import { ConfigurationContextFromXML } from "../../../context/types"
import { withConfigurationIndexYamlCollectionItemContext } from "../../../configurationIndex/collector/context"
import { importPropertyFromXML, PropertyRule, registerTypeRule } from "../../../orchestration"
import { exportPropertyValueToYAML } from "../../../orchestration/property/toYAML"
import type {
  ParameterValueXML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
} from "../parameterValue/types"
import { importSettingsParameterValueDcscorItemsFromXML } from "../settingsParameterValueCollection/dcscorItemsXML"
import { AppearanceFieldsPropertyRule, AppearanceFieldsRules, directAppearanceXmlTags } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

const appearanceParameterRules = AppearanceFieldsRules.properties as unknown as Partial<
  Record<string, SettingsParameterValuePropertyRule>
>

const appearanceStringPropertyKeys = new Set(["Формат", "Текст"])

const asArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const exportAppearanceStringValue = (value: unknown): unknown => {
  if (value === null) return null
  const record = asRecord(value)
  if (record?.type === "string" && typeof record.value === "string") return record.value
  if (record?.type === "LocalFormattedStringType") {
    const formatted = asRecord(record.value)
    const items = asRecord(formatted?.items)
    if (formatted?.formatted === true && items !== undefined) {
      return { Форматированный: "Истина", Текст: { ...items } }
    }
  }
  const items = asRecord(record?.items)
  if (items !== undefined) return { ...items }
  throw new Error("AppearanceFields XML: неподдерживаемое строковое значение")
}

const exportAppearanceStringParameter = (value: SettingsParameterValue, exported: unknown): unknown => {
  const sourceValues = Array.isArray(value.value) ? value.value : [value.value]
  if (sourceValues.length !== 1) {
    throw new Error("AppearanceFields XML: строковый параметр должен содержать одно значение")
  }
  const canonicalValue = exportAppearanceStringValue(sourceValues[0])
  const hasServiceFields =
    value.use === false ||
    value.item !== undefined ||
    value.viewMode !== undefined ||
    value.userSettingID !== undefined ||
    value.userSettingPresentation !== undefined
  if (!hasServiceFields) return canonicalValue

  const wrapper = asRecord(exported)
  if (wrapper === undefined) throw new Error("AppearanceFields XML: неверная развёрнутая строка")
  const { Тип: _type, Значение: _value, ...serviceFields } = wrapper
  return { ...serviceFields, Значение: canonicalValue }
}

const restoreAppearanceStringNilValues = (
  xml: AppearanceFieldsXML | undefined,
  parameters: Record<string, SettingsParameterValue>
): void => {
  for (const item of asArray(xml?.["dcscor:item"])) {
    const record = asRecord(item)
    const parameter = record?.["dcscor:parameter"]
    if (typeof parameter !== "string" || !appearanceStringPropertyKeys.has(parameter)) continue
    const value = asRecord(record?.["dcscor:value"])
    if (value?.["_xsi:nil"] === true || value?.["_xsi:nil"] === "true") {
      const imported = parameters[parameter]
      if (imported !== undefined) parameters[parameter] = { ...imported, value: null }
    }
  }
}

const usesDataSetFieldAppearanceXML = (rule: PropertyRule): boolean =>
  (rule as AppearanceFieldsPropertyRule).appearanceXml === "dataSetField"

const importDataSetFieldAppearanceFromXML = (
  context: ConfigurationContextFromXML,
  xml: AppearanceFieldsXML | undefined
): AppearanceFields | undefined => {
  if (xml === undefined) return undefined

  const parameters: Record<string, SettingsParameterValue> = {}

  for (const [parameterName, xmlTag] of Object.entries(directAppearanceXmlTags)) {
    const fieldXml = xml[xmlTag]
    if (fieldXml === undefined) continue

    const parameterRule = appearanceParameterRules[parameterName]
    if (parameterRule === undefined) continue

    const itemContext = withConfigurationIndexYamlCollectionItemContext(context, {
      index: Object.keys(parameters).length,
      yamlKey: parameterName,
    })

    const value = importPropertyFromXML({
      context: itemContext,
      rule: parameterRule,
      value: {
        "dcscor:parameter": parameterName,
        "dcscor:value": fieldXml["dcsset:value"],
      } satisfies ParameterValueXML,
    }) as SettingsParameterValue | undefined

    if (value !== undefined) {
      parameters[parameterName] = value
    }
  }

  if (Object.keys(parameters).length === 0) return undefined

  return {
    itemType: "AppearanceFields",
    ...parameters,
  }
}

const importAppearanceFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: AppearanceFieldsXML | undefined
): AppearanceFields | undefined => {
  if (usesDataSetFieldAppearanceXML(rule)) {
    return importDataSetFieldAppearanceFromXML(context, xml)
  }

  const parameters = importSettingsParameterValueDcscorItemsFromXML({
    context,
    ruleSet: { parameterRules: appearanceParameterRules },
    xml,
    skipUnknownParameters: true,
  })

  if (!parameters) return undefined
  restoreAppearanceStringNilValues(xml, parameters)

  return {
    itemType: "AppearanceFields",
    ...parameters,
  }
}

registerTypeRule("AppearanceFields", "importFromXML", importAppearanceFromXML)
registerTypeRule("AppearanceFields", "importFromXMLToYAML", ({ context, rule, xml }) => {
  const imported = importAppearanceFromXML(context, rule, xml as AppearanceFieldsXML | undefined)
  if (imported === undefined) return undefined
  const yaml: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(imported)) {
    if (key === "itemType") continue
    const propertyRule = appearanceParameterRules[key]
    if (propertyRule === undefined) continue
    const exported = exportPropertyValueToYAML({ context, rule: propertyRule, value })
    if (exported !== undefined) {
      yaml[propertyRule.yaml ?? key] = appearanceStringPropertyKeys.has(key)
        ? exportAppearanceStringParameter(value, exported)
        : exported
    }
  }
  return Object.keys(yaml).length === 0 ? undefined : yaml
})
