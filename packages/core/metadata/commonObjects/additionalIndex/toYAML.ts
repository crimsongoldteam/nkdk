import {
  AdditionalIndex,
  AdditionalIndexYAML,
  AdditionalIndexes,
  AdditionalIndexesYAML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToYAML } from "~/metadata/commonObjects/indexField/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"

export const exportAdditionalIndexToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AdditionalIndex | undefined
): AdditionalIndexYAML | undefined => {
  if (!data) return undefined

  return {
    ДополнительныеПоля: exportIndexFieldsToYAML(context, undefined, data.additionalFields),
    Имя: data.name,
    ИндексируемыеПоля: exportIndexFieldsToYAML(context, undefined, data.indexedFields),
    Таблица: data.table,
  }
}

export const exportAdditionalIndexesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AdditionalIndexes | undefined
): AdditionalIndexesYAML | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToYAML(context, undefined, value)!)
}

registerTypeRule("AdditionalIndex", "exportToYAML", exportAdditionalIndexesToYAML)
