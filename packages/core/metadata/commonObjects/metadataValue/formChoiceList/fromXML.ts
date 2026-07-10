import { ConfigurationContextFromXML } from "../../../context/types"
import { importI8nTextFromXML } from "../../i8nText/fromXML"
import { importMetadataValueFromXML } from "../fromXML"
import { MetadataFormChoiceListValue, MetadataFormChoiceListValueXML } from "../types"

export const importFormChoiceListFromXML = (
  context: ConfigurationContextFromXML,
  data: MetadataFormChoiceListValueXML
): MetadataFormChoiceListValue | undefined => {
  if (!data) return undefined
  const value = importMetadataValueFromXML({ context, rule: undefined, value: data.Value })
  const presentation = importI8nTextFromXML(context, { type: "I8nText" }, data.Presentation)
  const result: MetadataFormChoiceListValue = { type: "formChoiceListDesTimeValue" }
  if (value !== undefined) result.value = value
  if (presentation !== undefined) result.presentation = presentation
  return result
}
