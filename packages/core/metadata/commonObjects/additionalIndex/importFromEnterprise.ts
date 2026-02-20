import {
  AdditionalIndex,
  AdditionalIndexYAML,
  AdditionalIndexes,
  AdditionalIndexesYAML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromYAML } from "~/metadata/commonObjects/indexField/fromYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"

export const importAdditionalIndexFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: AdditionalIndexYAML | undefined
): AdditionalIndex | undefined => {
  if (!data) return undefined

  return {
    additionalFields: importIndexFieldsFromYAML(context, undefined, data.ДополнительныеПоля),
    indexedFields: importIndexFieldsFromYAML(context, undefined, data.ИндексируемыеПоля),
    name: data.Имя,
    table: data.Таблица,
  }
}

export const importAdditionalIndexesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: AdditionalIndexesYAML | undefined
): AdditionalIndexes | undefined => {
  if (!data) return undefined

  return data
    .map((value: AdditionalIndexYAML) => importAdditionalIndexFromYAML(context, undefined, value)!)
    .filter((item): item is AdditionalIndex => item !== undefined)
}

registerTypeRule("AdditionalIndex", "importFromYAML", importAdditionalIndexesFromYAML)
