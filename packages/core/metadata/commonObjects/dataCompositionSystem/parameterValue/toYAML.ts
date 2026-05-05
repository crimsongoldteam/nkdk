import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../../context/types"
import { exportDcsMetadataValueToYAML } from "../dcsMetadataValue/toYAML"
import type { MetadataDcsMetadataValue } from "../dcsMetadataValue/types"
import { toDcsMetadataValueRule } from "./dcsValueRule"
import type {
  ParameterValue,
  ParameterValueYAML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueYAML,
} from "./types"

const isChoiceParameterLinksArray = (v: unknown[]): boolean => {
  if (v.length === 0) return false
  const first = v[0]
  if (typeof first !== "object" || first === null) return false
  return "name" in first && "dataPath" in first && !("linkItem" in first)
}

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

export const exportParameterValueToYAML = (params: {
  context: ConfigurationContext
  rule: SettingsParameterValuePropertyRule
  data: ParameterValue | SettingsParameterValue
}): ParameterValueYAML | SettingsParameterValueYAML => {
  const { context, rule, data } = params
  const dcsRule = toDcsMetadataValueRule(rule)

  const values = normalizeValues(data.value)
  const exportedValues = values.map((v) => exportDcsMetadataValueToYAML(context, dcsRule, v))
  let значение: unknown
  if (exportedValues.length === 0) {
    значение = undefined
  } else if (exportedValues.length === 1) {
    значение = exportedValues[0]
  } else {
    значение = exportedValues
  }

  const elements = data.item?.map((child) => exportParameterValueToYAML({ context, rule, data: child }))

  const hasUse = data.use === false
  const hasValue = значение !== undefined
  const hasElements = elements !== undefined && elements.length > 0

  const base: Record<string, unknown> = {
    ...(hasUse ? { Использовать: "Ложь" as const } : {}),
    ...(hasValue ? { Значение: значение } : {}),
    ...(hasElements ? { Элементы: elements } : {}),
  }

  if (!hasSettingsExtension(data) && !hasUse && hasValue && !hasElements) {
    return значение as ParameterValueYAML
  }

  if (hasSettingsExtension(data)) {
    const sd = data as SettingsParameterValue
    return {
      ...base,
      ...(sd.viewMode !== undefined
        ? { РежимОтображения: SE.DataCompositionSettingsItemViewModeToYAML[sd.viewMode] }
        : {}),
      ...(sd.userSettingID !== undefined ? { ИдентификаторПользовательскойНастройки: sd.userSettingID } : {}),
      ...(sd.userSettingPresentation !== undefined
        ? {
            ПредставлениеПользовательскойНастройки: exportI8nTextToYAML({
              context,
              rule: { type: "I8nText" },
              value: sd.userSettingPresentation,
            }),
          }
        : {}),
    } as SettingsParameterValueYAML
  }

  return base as ParameterValueYAML
}

export const exportSettingsParameterValueToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): ParameterValueYAML | SettingsParameterValueYAML | undefined => {
  if (value === undefined) return undefined

  return exportParameterValueToYAML({
    context,
    rule: rule as unknown as SettingsParameterValuePropertyRule,
    data: value as ParameterValue | SettingsParameterValue,
  })
}

registerTypeRule("SettingsParameterValue", "exportToYAML", exportSettingsParameterValueToYAML)
