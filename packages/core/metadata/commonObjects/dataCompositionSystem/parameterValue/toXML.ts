import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../../context/types"
import { exportDcsMetadataValueToDcsXML } from "../dcsMetadataValue/toXML"
import type { MetadataDcsMetadataValue } from "../dcsMetadataValue/types"
import { toDcsMetadataValueRule } from "./dcsValueRule"
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

const hasSettingsExtension = (data: ParameterValue | SettingsParameterValue): data is SettingsParameterValue =>
  (data as SettingsParameterValue).viewMode !== undefined ||
  (data as SettingsParameterValue).userSettingID !== undefined ||
  (data as SettingsParameterValue).userSettingPresentation !== undefined

export const exportParameterValueToDcsXML = (params: {
  context: ConfigurationContext
  rule: SettingsParameterValuePropertyRule
  data: ParameterValue | SettingsParameterValue
  /** Для корня из `registerTypeRule("SettingsParameterValue")` — всегда с `xsi:type`. */
  rootSettingsXsi: boolean
}): ParameterValueXML | SettingsParameterValueXML => {
  const { context, rule, data, rootSettingsXsi } = params
  const dcsRule = toDcsMetadataValueRule(rule)

  const values = normalizeValues(data.value)
  const valueNodes: ParameterValueDcsValueFragment[] = []
  for (const v of values) {
    const fragment = exportDcsMetadataValueToDcsXML({ context, rule: dcsRule, data: v })
    valueNodes.push(fragment["dcscor:value"] as ParameterValueDcsValueFragment)
  }

  const itemsXml = data.item?.map((child) =>
    exportParameterValueToDcsXML({
      context,
      rule,
      data: child,
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
            "dcsset:userSettingPresentation": exportI8nTextToXML(
              context,
              { type: "I8nText" },
              sd.userSettingPresentation
            ),
          }
        : {}),
    } as SettingsParameterValueXML
  }

  return baseTyped
}

export const exportSettingsParameterValueToDcsXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  data: ParameterValue | SettingsParameterValue
): ParameterValueXML | SettingsParameterValueXML =>
  exportParameterValueToDcsXML({
    context,
    rule: rule as unknown as SettingsParameterValuePropertyRule,
    data,
    rootSettingsXsi: true,
  })

registerTypeRule("SettingsParameterValue", "exportToXML", exportSettingsParameterValueToDcsXML)
