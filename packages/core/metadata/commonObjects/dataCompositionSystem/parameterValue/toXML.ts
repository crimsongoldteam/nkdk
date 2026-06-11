import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../../context/types"
import { exportDcsMetadataValueToDcsXML } from "../dcsMetadataValue/toXML"
import type { MetadataDcsMetadataValue } from "../dcsMetadataValue/types"
import { toDcsMetadataValueRule } from "./dcsValueRule"
import { exportUserSettingPresentationToXML } from "./userSettingPresentationXML"
import type {
  ParameterValue,
  ParameterValueDcsValueFragment,
  ParameterValueXML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueXML,
} from "./types"

const isChoiceParameterLinksArray = (v: unknown[]): boolean => {
  if (v.length === 0) return false
  const first = v[0]
  if (typeof first !== "object" || first === null) return false
  return "name" in first && "dataPath" in first && !("linkItem" in first)
}

/** Один `dcscor:value` на элемент; `ChoiceParameterLinks` — массив ссылок в одном значении, не несколько `dcscor:value`. */
const normalizeValues = (v: ParameterValue["value"]): MetadataDcsMetadataValue[] => {
  if (v === undefined) return []
  if (!Array.isArray(v)) return [v]
  if (isChoiceParameterLinksArray(v)) {
    return [v as MetadataDcsMetadataValue]
  }
  return v
}

const isExplicitEmptyLocalStringType = (value: unknown): value is MetadataDcsMetadataValue => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false

  const keys = Object.keys(value)
  if (keys.length !== 1 || keys[0] !== "items") return false

  const items = (value as { items?: unknown }).items
  return typeof items === "object" && items !== null && !Array.isArray(items) && Object.keys(items).length === 0
}

const hasSettingsExtension = (data: ParameterValue | SettingsParameterValue): data is SettingsParameterValue =>
  (data as SettingsParameterValue).viewMode !== undefined ||
  (data as SettingsParameterValue).userSettingID !== undefined ||
  (data as SettingsParameterValue).userSettingPresentation !== undefined

const findReferenceParameterValue = (
  data: ParameterValue | SettingsParameterValue,
  referenceItems: ParameterValue[] | undefined,
  index: number
): ParameterValue | undefined => {
  if (referenceItems === undefined) return undefined

  const sameParameter = referenceItems.filter((referenceItem) => referenceItem.parameter === data.parameter)
  if (sameParameter.length === 1) return sameParameter[0]

  return referenceItems[index] ?? sameParameter[0]
}

export const exportParameterValueToDcsXML = (params: {
  context: ConfigurationContext
  rule: SettingsParameterValuePropertyRule
  data: ParameterValue | SettingsParameterValue
  referenceData?: ParameterValue | SettingsParameterValue | undefined
  /** Для корня из `registerTypeRule("SettingsParameterValue")` — всегда с `xsi:type`. */
  rootSettingsXsi: boolean
}): ParameterValueXML | SettingsParameterValueXML => {
  const { context, rule, data, referenceData, rootSettingsXsi } = params
  const dcsRule = toDcsMetadataValueRule(rule)

  const values = normalizeValues(data.value)
  const valueNodes: ParameterValueDcsValueFragment[] = []
  for (const v of values) {
    const fragment = exportDcsMetadataValueToDcsXML({ context, rule: dcsRule, data: v })
    valueNodes.push(fragment["dcscor:value"] as ParameterValueDcsValueFragment)
  }

  if (valueNodes.length === 0 && data.value === undefined && referenceData?.__referenceNilValue === true) {
    valueNodes.push({ "_xsi:nil": true } as ParameterValueDcsValueFragment)
  }

  const referenceValues = referenceData?.value !== undefined ? normalizeValues(referenceData.value) : []
  if (valueNodes.length === 0 && data.value === undefined && referenceValues.length === 1) {
    const referenceValue = referenceValues[0]
    if (isExplicitEmptyLocalStringType(referenceValue)) {
      const fragment = exportDcsMetadataValueToDcsXML({ context, rule: dcsRule, data: referenceValue })
      valueNodes.push(fragment["dcscor:value"] as ParameterValueDcsValueFragment)
    }
  }

  const itemsXml = data.item?.map((child, index) =>
    exportParameterValueToDcsXML({
      context,
      rule,
      data: child,
      referenceData: findReferenceParameterValue(child, referenceData?.item, index),
      rootSettingsXsi: hasSettingsExtension(child),
    })
  )

  // Порядок полей в объекте важен: текущий сериализатор XML уважает порядок вставки.
  // Для `SettingsParameterValue` ожидание в фикстурах: сначала `dcscor:use`, затем `dcscor:parameter`.
  const useFirst = data.use !== undefined
  const base: Record<string, unknown> = {}

  if (useFirst) base["dcscor:use"] = data.use
  base["dcscor:parameter"] = data.parameter

  if (valueNodes.length === 1) base["dcscor:value"] = valueNodes[0]
  else if (valueNodes.length > 1) base["dcscor:value"] = valueNodes

  if (itemsXml !== undefined && itemsXml.length > 0) {
    base["dcscor:item"] = itemsXml.length === 1 ? itemsXml[0] : itemsXml
  }

  const baseTyped = base as ParameterValueXML

  const settingsXsi = rootSettingsXsi || hasSettingsExtension(data)
  if (settingsXsi) {
    const sd = data as SettingsParameterValue
    return {
      ...baseTyped,
      "_xsi:type": "dcsset:SettingsParameterValue",
      ...(sd.viewMode !== undefined ? { "dcsset:viewMode": sd.viewMode } : {}),
      ...(sd.userSettingID !== undefined ? { "dcsset:userSettingID": sd.userSettingID } : {}),
      ...(sd.userSettingPresentation !== undefined
        ? {
            "dcsset:userSettingPresentation": exportUserSettingPresentationToXML({
              context,
              data: sd.userSettingPresentation,
              referenceData: (referenceData as SettingsParameterValue | undefined)?.userSettingPresentation,
            }),
          }
        : {}),
    } as SettingsParameterValueXML
  }

  return baseTyped
}

export const exportSettingsParameterValueToDcsXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  data: ParameterValue | SettingsParameterValue,
  referenceData?: ParameterValue | SettingsParameterValue | undefined
): ParameterValueXML | SettingsParameterValueXML =>
  exportParameterValueToDcsXML({
    context,
    rule: rule as unknown as SettingsParameterValuePropertyRule,
    data,
    referenceData,
    rootSettingsXsi: (rule as SettingsParameterValuePropertyRule).exportSettingsXsiType ?? true,
  })

registerTypeRule("SettingsParameterValue", "exportToXML", exportSettingsParameterValueToDcsXML)
