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
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject, removeDefaults } from "~/lib/metadata/helpers/compactObject"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { getDefaults } from "./defaults"

export const importStandardAttributeDescriptionFromXML = (
  xml: StandardAttributeDescriptionXML | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescription | undefined => {
  if (!xml) return undefined

  const result = {
    choiceForm: xml["xr:ChoiceForm"],
    choiceHistoryOnInput: xml["xr:ChoiceHistoryOnInput"],
    choiceParameterLinks: importChoiceParameterLinksFromXML(xml["xr:ChoiceParameterLinks"], configurationSettings),
    choiceParameters: importChoiceParameterLinksFromXML(xml["xr:ChoiceParameters"], configurationSettings),
    comment: xml["xr:Comment"],
    createOnInput: xml["xr:CreateOnInput"],
    dataHistory: xml["xr:DataHistory"],
    editFormat: importI8nTextFromXML(xml["xr:EditFormat"], configurationSettings),
    extendedEdit: importBooleanFromXML(xml["xr:ExtendedEdit"], configurationSettings),
    fillChecking: xml["xr:FillChecking"],
    fillFromFillingValue: xml["xr:FillFromFillingValue"],
    fillValue: importMetadataValueFromXML(xml["xr:FillValue"], configurationSettings),
    format: importI8nTextFromXML(xml["xr:Format"], configurationSettings),
    fullTextSearch: xml["xr:FullTextSearch"],
    linkByType: importTypeLinkFromXML(xml["xr:LinkByType"], configurationSettings),
    markNegatives: xml["xr:MarkNegatives"],
    mask: xml["xr:Mask"],
    maxValue: xml["xr:MaxValue"],
    minValue: xml["xr:MinValue"],
    multiLine: importBooleanFromXML(xml["xr:MultiLine"], configurationSettings),
    name: xml._name,
    passwordMode: importBooleanFromXML(xml["xr:PasswordMode"], configurationSettings),
    quickChoice: xml["xr:QuickChoice"],
    synonym: importI8nTextFromXML(xml["xr:Synonym"], configurationSettings),
    toolTip: importI8nTextFromXML(xml["xr:ToolTip"], configurationSettings),
    type: importTypeDescriptionFromXML(xml["xr:Type"], configurationSettings),
    typeReductionMode: xml["xr:TypeReductionMode"],
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, configurationSettings)
  const resultWithoutDefaults = removeDefaults(compactedResult, defaults)

  // If only name remains after removing defaults, return undefined
  if (Object.keys(resultWithoutDefaults).length === 1 && resultWithoutDefaults.name) {
    return undefined
  }

  return resultWithoutDefaults
}

export const importStandardAttributeDescriptionsFromXML = (
  xml: StandardAttributeDescriptionsXML | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescriptions | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  const result = items
    .map((value: StandardAttributeDescriptionXML) =>
      importStandardAttributeDescriptionFromXML(value, configurationSettings)
    )
    .filter((item): item is StandardAttributeDescription => item !== undefined)

  if (result.length === 0) return undefined

  return result
}
