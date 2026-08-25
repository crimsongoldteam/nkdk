import { ConfigurationContext } from "@nkdk/runtime"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import * as SE from "../../../systemEnumerations/types"
import type { AvailableFieldItem, AvailableFieldItemYAML, AvailableFields, AvailableFieldsYAML } from "./types"

const isYamlObject = (value: AvailableFieldItemYAML): value is Exclude<AvailableFieldItemYAML, string> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const hasMetadata = (item: Exclude<AvailableFieldItemYAML, string>): boolean =>
  item.Использование !== undefined ||
  item.Заголовок !== undefined ||
  item.МногоязычныйЗаголовок !== undefined ||
  item.РежимОтображения !== undefined

const importBoolean = (value: Exclude<AvailableFieldItemYAML, string>["Использование"]): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

const importItem = (
  context: ConfigurationContext,
  collection: AvailableFieldsYAML,
  index: number,
  item: AvailableFieldItemYAML,
): AvailableFieldItem | undefined => {
  if (typeof item === "string") return importFieldName(collection, index, item)
  if (!isYamlObject(item) || !item.Поле) return undefined
  const field = importFieldName(item, "Поле", item.Поле)
  if (!hasMetadata(item)) return field

  const viewMode = item.РежимОтображения

  return {
    field,
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
    ...(item.МногоязычныйЗаголовок !== undefined
      ? {
          lwsTitle: importI8nTextFromYAML({
            context,
            rule: { type: "I8nText" },
            value: item.МногоязычныйЗаголовок,
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

  const fields = yaml
    .map((item, index) => importItem(context, yaml, index, item))
    .filter((field): field is AvailableFieldItem => Boolean(field))
  return fields.length > 0 ? fields : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("AvailableFields", "importFromYAML", importAvailableFieldsFromYAML)

function importFieldName(_parent: object, _key: string | number, value: string): string {
  return value
}
