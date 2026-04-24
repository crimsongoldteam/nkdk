import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexXML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToXML } from "~/metadata/commonObjects/indexField/toXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"

export const exportAdditionalIndexToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AdditionalIndex | undefined
): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return {
    Name: data.name,
    Table: data.table,
    IndexedFields: exportIndexFieldsToXML(context, undefined, data.indexedFields),
    AdditionalFields: exportIndexFieldsToXML(context, undefined, data.additionalFields),
  }
}

/**
 * Обработчик exportToXML для типа "AdditionalIndex".
 * Возвращает содержимое контейнера: { AdditionalIndex: AdditionalIndexXML | AdditionalIndexXML[] }
 * Корневые атрибуты (xmlns и т.п.) добавляет оркестратор.
 */
export const exportAdditionalIndexesToContainerXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AdditionalIndexes | undefined
): { AdditionalIndex: AdditionalIndexXML[] } | undefined => {
  if (!data || data.length === 0) return undefined
  return { AdditionalIndex: data.map((item) => exportAdditionalIndexToXML(context, undefined, item)!) }
}

registerTypeRule("AdditionalIndex", "exportToXML", exportAdditionalIndexesToContainerXML)
