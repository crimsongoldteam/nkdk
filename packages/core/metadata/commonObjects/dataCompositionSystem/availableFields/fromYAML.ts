import { ConfigurationContext } from "~/metadata/context/types"
import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"
import type { AvailableFieldItem, AvailableFieldItemYAML, AvailableFields, AvailableFieldsYAML } from "./types"

const isYamlObject = (value: AvailableFieldItemYAML): value is Exclude<AvailableFieldItemYAML, string> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const importBoolean = (value: Exclude<AvailableFieldItemYAML, string>["Использование"]): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

const importItem = (context: ConfigurationContext, item: AvailableFieldItemYAML): AvailableFieldItem | undefined => {
  if (typeof item === "string") return item || undefined
  if (!isYamlObject(item) || !item.Поле) return undefined

  const viewMode = item.РежимОтображения

  return {
    field: item.Поле,
    ...(item.Использование !== undefined ? { use: importBoolean(item.Использование) } : {}),
    ...(item.Заголовок !== undefined
      ? {
          title: importI8nTextFromYAML({
            context,
            rule: { type: "I8nText" },
            value: item.Заголовок,
          }),
        }
      : {}),
    ...(item.ЗаголовокLWS !== undefined
      ? {
          lwsTitle: importI8nTextFromYAML({
            context,
            rule: { type: "I8nText" },
            value: item.ЗаголовокLWS,
          }),
        }
      : {}),
    ...(viewMode !== undefined ? { viewMode: SE.DataCompositionSettingsItemViewModeFromYAML[viewMode] } : {}),
  }
}

const importAvailableFieldsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: AvailableFieldsYAML | undefined
): AvailableFields | undefined => {
  if (!yaml) return undefined

  const fields = yaml.map((item) => importItem(context, item)).filter((field): field is AvailableFieldItem => Boolean(field))
  return fields.length > 0 ? fields : undefined
}

registerTypeRule("AvailableFields", "importFromYAML", importAvailableFieldsFromYAML)
