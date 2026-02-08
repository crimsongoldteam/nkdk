import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToXML } from "~/metadata/commonObjects/indexField/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportAdditionalIndexToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: AdditionalIndex | undefined
): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return {
    AdditionalFields: exportIndexFieldsToXML(context, undefined, data.additionalFields),
    IndexedFields: exportIndexFieldsToXML(context, undefined, data.indexedFields),
    Name: data.name,
    Table: data.table,
  }
}

export const exportAdditionalIndexesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: AdditionalIndexes | undefined
): AdditionalIndexesXML | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToXML(context, undefined, value)!)
}
