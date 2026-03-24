import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import type { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToYAML } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"
import type { AppearanceFields, AppearanceFieldsYAML } from "../appearanceFields/types"
import { exportFilterToYAML } from "../filter/toYAML"
import type { Filter } from "../filter/types"
import type { ConditionalAppearanceItem, ConditionalAppearanceItemYAML } from "./types"

/** См. importSelectionFromYAML. */
const exportSelectionToYAML = (fields: AppearanceFields | undefined): string[] | undefined => {
  if (!fields) return undefined
  const names = (fields as unknown as { _fieldNames?: string[] })._fieldNames
  return names && names.length > 0 ? names : undefined
}

export const exportConditionalAppearanceItemToYAML = (
  context: ConfigurationContext,
  item: ConditionalAppearanceItem
): ConditionalAppearanceItemYAML => {
  const selectionNames = exportSelectionToYAML(item.fields)
  const filter = item.filter !== undefined ? exportFilterToYAML(context, item.filter as Filter | undefined) : undefined
  const appearance =
    item.appearance !== undefined
      ? (exportPropertyToYAML({
          context,
          rule: { type: "Appearance" },
          value: item.appearance,
        }) as AppearanceFieldsYAML | undefined)
      : undefined
  const presentation =
    item.presentation !== undefined
      ? exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: item.presentation })
      : undefined
  const userSettingPresentation =
    item.userSettingPresentation !== undefined
      ? exportI8nTextToYAML({
          context,
          rule: { type: "I8nText" },
          value: item.userSettingPresentation,
        })
      : undefined

  return {
    ...(item.use !== undefined ? { Использование: item.use ? ("Истина" as const) : ("Ложь" as const) } : {}),
    ...(selectionNames !== undefined ? { Поля: selectionNames as never } : {}),
    ...(filter !== undefined ? { Отбор: filter as never } : {}),
    ...(appearance !== undefined ? { Оформление: appearance } : {}),
    ...(presentation !== undefined ? { Представление: presentation } : {}),
    ...(item.viewMode !== undefined
      ? {
          РежимОтображения: SE.DataCompositionSettingsItemViewModeToYAML[item.viewMode] as never,
        }
      : {}),
    ...(item.userSettingID ? { ИдентификаторПользовательскойНастройки: item.userSettingID } : {}),
    ...(userSettingPresentation !== undefined
      ? { ПредставлениеПользовательскойНастройки: userSettingPresentation }
      : {}),
    ...(item.useInGroup !== undefined
      ? {
          ИспользоватьВГруппировке: SE.DataCompositionConditionalAppearanceUseToYAML[item.useInGroup] as never,
        }
      : {}),
    ...(item.useInHierarchicalGroup !== undefined
      ? {
          ИспользоватьВИерархическойГруппировке: SE.DataCompositionConditionalAppearanceUseToYAML[
            item.useInHierarchicalGroup
          ] as never,
        }
      : {}),
    ...(item.useInOverall !== undefined
      ? {
          ИспользоватьВОбщемИтоге: SE.DataCompositionConditionalAppearanceUseToYAML[item.useInOverall] as never,
        }
      : {}),
    ...(item.useInFieldsHeader !== undefined
      ? {
          ИспользоватьВЗаголовкеПолей: SE.DataCompositionConditionalAppearanceUseToYAML[
            item.useInFieldsHeader
          ] as never,
        }
      : {}),
    ...(item.useInHeader !== undefined
      ? {
          ИспользоватьВЗаголовке: SE.DataCompositionConditionalAppearanceUseToYAML[item.useInHeader] as never,
        }
      : {}),
    ...(item.useInParameters !== undefined
      ? {
          ИспользоватьВПараметрах: SE.DataCompositionConditionalAppearanceUseToYAML[item.useInParameters] as never,
        }
      : {}),
    ...(item.useInFilter !== undefined
      ? {
          ИспользоватьВОтборе: SE.DataCompositionConditionalAppearanceUseToYAML[item.useInFilter] as never,
        }
      : {}),
    ...(item.useInResourceFieldsHeader !== undefined
      ? {
          ИспользоватьВЗаголовкеПолейРесурсов: SE.DataCompositionConditionalAppearanceUseToYAML[
            item.useInResourceFieldsHeader
          ] as never,
        }
      : {}),
    ...(item.useInOverallHeader !== undefined
      ? {
          ИспользоватьВЗаголовкеОбщегоИтога: SE.DataCompositionConditionalAppearanceUseToYAML[
            item.useInOverallHeader
          ] as never,
        }
      : {}),
    ...(item.useInOverallResourceFieldsHeader !== undefined
      ? {
          ИспользоватьВЗаголовкеПолейРесурсовОбщегоИтога: SE.DataCompositionConditionalAppearanceUseToYAML[
            item.useInOverallResourceFieldsHeader
          ] as never,
        }
      : {}),
  } as ConditionalAppearanceItemYAML
}
