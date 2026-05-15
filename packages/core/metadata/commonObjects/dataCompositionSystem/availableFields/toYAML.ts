import { ConfigurationContext } from "~/metadata/context/types"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"
import type { AvailableFieldItem, AvailableFieldItemYAML, AvailableFields, AvailableFieldsYAML } from "./types"

const exportBoolean = (value: boolean): "Истина" | "Ложь" => (value ? "Истина" : "Ложь")

const exportItem = (context: ConfigurationContext, item: AvailableFieldItem): AvailableFieldItemYAML => {
  if (typeof item === "string") return item

  return {
    Поле: item.field,
    ...(item.use !== undefined ? { Использование: exportBoolean(item.use) } : {}),
    ...(item.title !== undefined
      ? {
          Заголовок: exportI8nTextToYAML({
            context,
            rule: { type: "I8nText" },
            value: item.title,
          }),
        }
      : {}),
    ...(item.lwsTitle !== undefined
      ? {
          МногоязычныйЗаголовок: exportI8nTextToYAML({
            context,
            rule: { type: "I8nText" },
            value: item.lwsTitle,
          }),
        }
      : {}),
    ...(item.viewMode !== undefined
      ? { РежимОтображения: SE.DataCompositionSettingsItemViewModeToYAML[item.viewMode] }
      : {}),
  }
}

const exportAvailableFieldsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AvailableFields | undefined
): AvailableFieldsYAML | undefined => {
  if (!data || data.length === 0) return undefined
  return data.map((item) => exportItem(context, item))
}

registerTypeRule("AvailableFields", "exportToYAML", exportAvailableFieldsToYAML)
