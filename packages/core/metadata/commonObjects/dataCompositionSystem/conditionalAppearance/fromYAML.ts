import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importPropertyFromYAML } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"
import { AppearanceFieldsRules } from "../appearanceFields/rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "../appearanceFields/types"
import { importFilterFromYAML } from "../filter/fromYAML"
import type { FilterYAML } from "../filter/types"
import { ConditionalAppearanceItemRules } from "./rules"
import type { ConditionalAppearanceItem, ConditionalAppearanceItemYAML } from "./types"

/** Ключ «Поля» — массив строк; в модели то же внутреннее представление, что и для DCS. */
const importSelectionFromYAML = (value: unknown): AppearanceFields | undefined => {
  if (!value) return undefined
  const names = Array.isArray(value) ? value.map(String) : [String(value)]
  return { itemType: AppearanceFieldsRules.itemType, _fieldNames: names } as unknown as AppearanceFields
}

export const importConditionalAppearanceItemFromYAML = (
  context: ConfigurationContext,
  yaml: ConditionalAppearanceItemYAML
): ConditionalAppearanceItem => {
  const y = yaml as Record<string, unknown>

  const use = y["Использование"] !== undefined ? y["Использование"] === "Истина" : undefined
  const fields = importSelectionFromYAML(y["Поля"])
  const appearance =
    y["Оформление"] !== undefined
      ? (importPropertyFromYAML({
          context,
          rule: { type: "Appearance" },
          value: y["Оформление"] as AppearanceFieldsYAML,
        }) as AppearanceFields | undefined)
      : undefined
  const filter = y["Отбор"] !== undefined ? importFilterFromYAML(context, y["Отбор"] as FilterYAML) : undefined
  const presentation =
    y["Представление"] !== undefined
      ? importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: y["Представление"] as never })
      : undefined
  const userSettingPresentation =
    y["ПредставлениеПользовательскойНастройки"] !== undefined
      ? importI8nTextFromYAML({
          context,
          rule: { type: "I8nText" },
          value: y["ПредставлениеПользовательскойНастройки"] as never,
        })
      : undefined
  const vmYaml = y["РежимОтображения"] as SE.DataCompositionSettingsItemViewModeYAML | undefined
  const useInGroupYaml = y["ИспользоватьВГруппировке"] as SE.DataCompositionConditionalAppearanceUseYAML | undefined
  const useInHGYaml = y["ИспользоватьВИерархическойГруппировке"] as
    | SE.DataCompositionConditionalAppearanceUseYAML
    | undefined
  const useInOverallYaml = y["ИспользоватьВОбщемИтоге"] as SE.DataCompositionConditionalAppearanceUseYAML | undefined
  const useInFHYaml = y["ИспользоватьВЗаголовкеПолей"] as SE.DataCompositionConditionalAppearanceUseYAML | undefined
  const useInHeaderYaml = y["ИспользоватьВЗаголовке"] as SE.DataCompositionConditionalAppearanceUseYAML | undefined
  const useInParamsYaml = y["ИспользоватьВПараметрах"] as SE.DataCompositionConditionalAppearanceUseYAML | undefined
  const useInFilterYaml = y["ИспользоватьВОтборе"] as SE.DataCompositionConditionalAppearanceUseYAML | undefined
  const useInRFHYaml = y["ИспользоватьВЗаголовкеПолейРесурсов"] as
    | SE.DataCompositionConditionalAppearanceUseYAML
    | undefined
  const useInOHYaml = y["ИспользоватьВЗаголовкеОбщегоИтога"] as
    | SE.DataCompositionConditionalAppearanceUseYAML
    | undefined
  const useInORFHYaml = y["ИспользоватьВЗаголовкеПолейРесурсовОбщегоИтога"] as
    | SE.DataCompositionConditionalAppearanceUseYAML
    | undefined

  return {
    itemType: ConditionalAppearanceItemRules.itemType,
    ...(use !== undefined ? { use } : {}),
    ...(fields !== undefined ? { fields } : {}),
    ...(filter !== undefined ? { filter } : {}),
    ...(appearance !== undefined ? { appearance } : {}),
    ...(presentation !== undefined ? { presentation } : {}),
    ...(vmYaml !== undefined ? { viewMode: SE.DataCompositionSettingsItemViewModeFromYAML[vmYaml] } : {}),
    ...(y["ИдентификаторПользовательскойНастройки"]
      ? { userSettingID: String(y["ИдентификаторПользовательскойНастройки"]) }
      : {}),
    ...(userSettingPresentation !== undefined ? { userSettingPresentation } : {}),
    ...(useInGroupYaml !== undefined
      ? { useInGroup: SE.DataCompositionConditionalAppearanceUseFromYAML[useInGroupYaml] }
      : {}),
    ...(useInHGYaml !== undefined
      ? {
          useInHierarchicalGroup: SE.DataCompositionConditionalAppearanceUseFromYAML[useInHGYaml],
        }
      : {}),
    ...(useInOverallYaml !== undefined
      ? { useInOverall: SE.DataCompositionConditionalAppearanceUseFromYAML[useInOverallYaml] }
      : {}),
    ...(useInFHYaml !== undefined
      ? {
          useInFieldsHeader: SE.DataCompositionConditionalAppearanceUseFromYAML[useInFHYaml],
        }
      : {}),
    ...(useInHeaderYaml !== undefined
      ? { useInHeader: SE.DataCompositionConditionalAppearanceUseFromYAML[useInHeaderYaml] }
      : {}),
    ...(useInParamsYaml !== undefined
      ? {
          useInParameters: SE.DataCompositionConditionalAppearanceUseFromYAML[useInParamsYaml],
        }
      : {}),
    ...(useInFilterYaml !== undefined
      ? { useInFilter: SE.DataCompositionConditionalAppearanceUseFromYAML[useInFilterYaml] }
      : {}),
    ...(useInRFHYaml !== undefined
      ? {
          useInResourceFieldsHeader: SE.DataCompositionConditionalAppearanceUseFromYAML[useInRFHYaml],
        }
      : {}),
    ...(useInOHYaml !== undefined
      ? {
          useInOverallHeader: SE.DataCompositionConditionalAppearanceUseFromYAML[useInOHYaml],
        }
      : {}),
    ...(useInORFHYaml !== undefined
      ? {
          useInOverallResourceFieldsHeader: SE.DataCompositionConditionalAppearanceUseFromYAML[useInORFHYaml],
        }
      : {}),
  }
}
