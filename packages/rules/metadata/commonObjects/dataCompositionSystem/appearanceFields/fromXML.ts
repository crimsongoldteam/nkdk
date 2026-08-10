import { ConfigurationContextFromXML } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { exportPropertyValueToYAML } from "../../../ruleRuntime/property/toYAML"
import type { SettingsParameterValue, SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { importSettingsParameterValueDcscorItemsFromXML } from "../settingsParameterValueCollection/dcscorItemsXML"
import { AppearanceFieldsRules } from "./rules"
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

const exportAppearanceStringValue = (value: unknown): Record<string, unknown> | string => {
  if (value === undefined) return {}
  if (value === null) return { Значение: null }
  const record = asRecord(value)
  if (record?.type === "string" && typeof record.value === "string") return record.value
  if (record?.type === "Field" && typeof record.value === "string") {
    return { Тип: "Поле", Значение: record.value }
  }
  if (record?.type === "LocalFormattedStringType") {
    const formatted = asRecord(record.value)
    const items = asRecord(formatted?.items)
    if (formatted?.formatted === true && items !== undefined) {
      return { Тип: "ФорматированнаяСтрока", Значение: { ...items } }
    }
  }
  const items = asRecord(record?.items)
  if (items !== undefined) return { Значение: { ...items } }
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
  const canonicalObject =
    typeof canonicalValue === "string" ? { Значение: canonicalValue } : asRecord(canonicalValue)
  if (wrapper === undefined || canonicalObject === undefined) {
    throw new Error("AppearanceFields XML: неверная развёрнутая строка")
  }
  const { Тип: _type, Значение: _value, ...serviceFields } = wrapper
  return { ...canonicalObject, ...serviceFields }
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

const importAppearanceFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: AppearanceFieldsXML | undefined
): AppearanceFields | undefined => {
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

export const metadataPropertyRule000 = definePropertyTypeRule("AppearanceFields", "importFromXML", importAppearanceFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("AppearanceFields", "importFromXMLToYAML", ({ context, rule, xml }) => {
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
