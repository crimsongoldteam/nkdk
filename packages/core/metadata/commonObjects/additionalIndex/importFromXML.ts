import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromXML } from "~/metadata/commonObjects/indexField/importFromXML"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"

export const importAdditionalIndexFromXML = (
  context: Context,
  xml: AdditionalIndexXML | undefined
): AdditionalIndex | undefined => {
  if (!xml) return undefined

  return compactObject({
    additionalFields: importIndexFieldsFromXML(context, xml.AdditionalFields),
    indexedFields: importIndexFieldsFromXML(context, xml.IndexedFields),
    name: xml.Name,
    table: xml.Table,
  })
}

export const importAdditionalIndexesFromXML = (
  context: Context,
  xml: AdditionalIndexesXML | undefined
): AdditionalIndexes | undefined => {
  if (!xml) return undefined

  return xml.map((value: AdditionalIndexXML) => importAdditionalIndexFromXML(context, value)!)
}
