import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject, removeDefaults } from "~/lib/metadata/helpers/compactObject"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { getDefaults } from "./defaults"

export const importStandardAttributeDescriptionFromXML = (
  configurationSettings: Context,
  xml: StandardAttributeDescriptionXML | undefined
): StandardAttributeDescription | undefined => {
  if (!xml) return undefined

  const result = {
    choiceForm: xml["xr:ChoiceForm"],
    choiceHistoryOnInput: xml["xr:ChoiceHistoryOnInput"],
    choiceParameterLinks: importChoiceParameterLinksFromXML(configurationSettings, xml["xr:ChoiceParameterLinks"]),
    choiceParameters: importChoiceParameterLinksFromXML(configurationSettings, xml["xr:ChoiceParameters"]),
    comment: xml["xr:Comment"],
    createOnInput: xml["xr:CreateOnInput"],
    dataHistory: xml["xr:DataHistory"],
    editFormat: importI8nTextFromXML(configurationSettings, xml["xr:EditFormat"]),
    extendedEdit: importBooleanFromXML(configurationSettings, xml["xr:ExtendedEdit"]),
    fillChecking: xml["xr:FillChecking"],
    fillFromFillingValue: xml["xr:FillFromFillingValue"],
    fillValue: importMetadataValueFromXML(configurationSettings, xml["xr:FillValue"]),
    format: importI8nTextFromXML(configurationSettings, xml["xr:Format"]),
    fullTextSearch: xml["xr:FullTextSearch"],
    linkByType: importTypeLinkFromXML(configurationSettings, xml["xr:LinkByType"]),
    markNegatives: xml["xr:MarkNegatives"],
    mask: xml["xr:Mask"],
    maxValue: xml["xr:MaxValue"],
    minValue: xml["xr:MinValue"],
    multiLine: importBooleanFromXML(configurationSettings, xml["xr:MultiLine"]),
    name: xml._name,
    passwordMode: importBooleanFromXML(configurationSettings, xml["xr:PasswordMode"]),
    quickChoice: xml["xr:QuickChoice"],
    synonym: importI8nTextFromXML(configurationSettings, xml["xr:Synonym"]),
    toolTip: importI8nTextFromXML(configurationSettings, xml["xr:ToolTip"]),
    type: importTypeDescriptionFromXML(configurationSettings, xml["xr:Type"]),
    typeReductionMode: xml["xr:TypeReductionMode"],
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, configurationSettings)
  const resultWithoutDefaults = removeDefaults(compactedResult, defaults)

  const keyCount = Object.keys(resultWithoutDefaults).length

  if (keyCount === 0) return undefined

  if (keyCount === 1 && resultWithoutDefaults.name) return undefined

  return resultWithoutDefaults
}

export const importStandardAttributeDescriptionsFromXML = (
  configurationSettings: Context,
  xml: StandardAttributeDescriptionsXML | undefined
): StandardAttributeDescriptions | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  const result: StandardAttributeDescriptions = []

  items.forEach((value: StandardAttributeDescriptionXML) => {
    const item = importStandardAttributeDescriptionFromXML(configurationSettings, value)
    if (item) {
      result.push(item)
    }
  })

  if (result.length === 0) return undefined

  return result
}
