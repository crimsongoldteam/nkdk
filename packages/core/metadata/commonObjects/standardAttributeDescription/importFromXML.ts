import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataValueFromXML } from "~/metadata/commonObjects/metadataValue/importFromXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { Context } from "~/metadata/context/types"
import { compactObject, removeDefaults } from "~/metadata/helpers/compactObject"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { getDefaults } from "./defaults"

export const importStandardAttributeDescriptionFromXML = (
  context: Context,
  xml: StandardAttributeDescriptionXML | undefined
): StandardAttributeDescription | undefined => {
  if (!xml) return undefined

  const result = {
    choiceForm: xml["xr:ChoiceForm"],
    choiceHistoryOnInput: xml["xr:ChoiceHistoryOnInput"],
    choiceParameterLinks: importChoiceParameterLinksFromXML(context, xml["xr:ChoiceParameterLinks"]),
    choiceParameters: importChoiceParameterLinksFromXML(context, xml["xr:ChoiceParameters"]),
    comment: xml["xr:Comment"],
    createOnInput: xml["xr:CreateOnInput"],
    dataHistory: xml["xr:DataHistory"],
    editFormat: importI8nTextFromXML(context, xml["xr:EditFormat"]),
    extendedEdit: importBooleanFromXML(context, xml["xr:ExtendedEdit"]),
    fillChecking: xml["xr:FillChecking"],
    fillFromFillingValue: xml["xr:FillFromFillingValue"],
    fillValue: importMetadataValueFromXML(context, xml["xr:FillValue"]),
    format: importI8nTextFromXML(context, xml["xr:Format"]),
    fullTextSearch: xml["xr:FullTextSearch"],
    linkByType: importTypeLinkFromXML(context, xml["xr:LinkByType"]),
    markNegatives: xml["xr:MarkNegatives"],
    mask: xml["xr:Mask"],
    maxValue: xml["xr:MaxValue"],
    minValue: xml["xr:MinValue"],
    multiLine: importBooleanFromXML(context, xml["xr:MultiLine"]),
    name: xml._name,
    passwordMode: importBooleanFromXML(context, xml["xr:PasswordMode"]),
    quickChoice: xml["xr:QuickChoice"],
    synonym: importI8nTextFromXML(context, xml["xr:Synonym"]),
    toolTip: importI8nTextFromXML(context, xml["xr:ToolTip"]),
    type: importTypeDescriptionFromXML(context, xml["xr:Type"]),
    typeReductionMode: xml["xr:TypeReductionMode"],
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, context)
  const resultWithoutDefaults = removeDefaults(compactedResult, defaults)

  const keyCount = Object.keys(resultWithoutDefaults).length

  if (keyCount === 0) return undefined

  if (keyCount === 1 && resultWithoutDefaults.name) return undefined

  return resultWithoutDefaults
}

export const importStandardAttributeDescriptionsFromXML = (
  context: Context,
  xml: StandardAttributeDescriptionsXML | undefined
): StandardAttributeDescriptions | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  const result: StandardAttributeDescriptions = []

  items.forEach((value: StandardAttributeDescriptionXML) => {
    const item = importStandardAttributeDescriptionFromXML(context, value)
    if (item) {
      result.push(item)
    }
  })

  if (result.length === 0) return undefined

  return result
}
