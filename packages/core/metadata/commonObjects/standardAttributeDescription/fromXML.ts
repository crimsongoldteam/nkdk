import { importMetadataValueFromXML } from "~/metadata/commonObjects/metadataValue/fromXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/fromXML"
import { importTypeLinkFromXML } from "~/metadata/commonObjects/typeLink/fromXML"
import { importChoiceParameterLinksFromXML } from "~/metadata/commonObjects/сhoiceParameterLinks/fromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { importBooleanFromXML } from "../boolean/fromXML"
import { importI8nTextFromXML } from "../i8nText/fromXML"
import { importChoiceParametersFromXML } from "../сhoiceParameters/fromXML"
import { getDefaults } from "./defaults"

export const importStandardAttributeDescriptionsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: StandardAttributeDescriptionsXML | undefined
): StandardAttributeDescriptions | undefined => {
  if (!xml) return undefined

  const xrStandardAttribute = xml["xr:StandardAttribute"]

  const items = Array.isArray(xrStandardAttribute) ? xrStandardAttribute : [xrStandardAttribute]

  const result: StandardAttributeDescriptions = []

  for (const value of items) {
    const item = importStandardAttributeDescriptionFromXML(context, undefined, value)
    if (item) {
      result.push(item)
    }
  }

  if (result.length === 0) return undefined

  return result
}

const importStandardAttributeDescriptionFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: StandardAttributeDescriptionXML
): StandardAttributeDescription | undefined => {
  const result: StandardAttributeDescription = {
    name: xml._name,
  }

  if (xml["xr:ChoiceForm"] !== undefined) result.choiceForm = xml["xr:ChoiceForm"]

  if (xml["xr:ChoiceHistoryOnInput"] !== undefined) result.choiceHistoryOnInput = xml["xr:ChoiceHistoryOnInput"]

  const choiceParameterLinks = importChoiceParameterLinksFromXML(context, undefined, xml["xr:ChoiceParameterLinks"])
  if (choiceParameterLinks) result.choiceParameterLinks = choiceParameterLinks

  const choiceParameters = importChoiceParametersFromXML(context, undefined, xml["xr:ChoiceParameters"])
  if (choiceParameters) result.choiceParameters = choiceParameters

  if (xml["xr:Comment"] !== undefined) result.comment = xml["xr:Comment"]
  if (xml["xr:CreateOnInput"] !== undefined) result.createOnInput = xml["xr:CreateOnInput"]
  if (xml["xr:DataHistory"] !== undefined) result.dataHistory = xml["xr:DataHistory"]

  const editFormat = importI8nTextFromXML(context, { type: "I8nText" }, xml["xr:EditFormat"])
  if (editFormat) result.editFormat = editFormat

  const extendedEdit = importBooleanFromXML(context, undefined, xml["xr:ExtendedEdit"])
  if (extendedEdit) result.extendedEdit = extendedEdit

  if (xml["xr:FillChecking"] !== undefined) result.fillChecking = xml["xr:FillChecking"]
  if (xml["xr:FillFromFillingValue"] !== undefined) result.fillFromFillingValue = xml["xr:FillFromFillingValue"]

  const fillValue = importMetadataValueFromXML(context, undefined, xml["xr:FillValue"])
  if (fillValue) result.fillValue = fillValue

  const format = importI8nTextFromXML(context, { type: "I8nText" }, xml["xr:Format"])
  if (format) result.format = format

  if (xml["xr:FullTextSearch"] !== undefined) result.fullTextSearch = xml["xr:FullTextSearch"]

  const linkByType = importTypeLinkFromXML(context, undefined, xml["xr:LinkByType"])
  if (linkByType) result.linkByType = linkByType

  if (xml["xr:MarkNegatives"] !== undefined) result.markNegatives = xml["xr:MarkNegatives"]
  if (xml["xr:Mask"]) result.mask = String(xml["xr:Mask"])
  if (xml["xr:MaxValue"] !== undefined) result.maxValue = xml["xr:MaxValue"]
  if (xml["xr:MinValue"] !== undefined) result.minValue = xml["xr:MinValue"]

  const multiLine = importBooleanFromXML(context, undefined, xml["xr:MultiLine"])
  if (multiLine !== undefined) result.multiLine = multiLine

  const passwordMode = importBooleanFromXML(context, undefined, xml["xr:PasswordMode"])
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  if (xml["xr:QuickChoice"] !== undefined) result.quickChoice = xml["xr:QuickChoice"]

  const synonym = importI8nTextFromXML(context, { type: "I8nText" }, xml["xr:Synonym"])
  if (synonym !== undefined) result.synonym = synonym

  const toolTip = importI8nTextFromXML(context, { type: "I8nText" }, xml["xr:ToolTip"])
  if (toolTip !== undefined) result.toolTip = toolTip

  const type = importTypeDescriptionFromXML(context, undefined, xml["xr:Type"])
  if (type) result.type = type

  if (xml["xr:TypeReductionMode"] !== undefined) result.typeReductionMode = xml["xr:TypeReductionMode"]

  const defaults = getDefaults(context, result)
  const resultWithoutDefaults = removeDefaults(result, defaults)

  const keyCount = Object.keys(resultWithoutDefaults).length

  if (keyCount === 1) return undefined

  return resultWithoutDefaults
}

registerTypeRule("StandardAttributeDescription", "importFromXML", importStandardAttributeDescriptionsFromXML)
