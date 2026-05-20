import { ConfigurationContext } from "~/metadata/context/types"
import { I8nText } from "../../i8nText/types"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { importMetadataValueFromYAML } from "../fromYAML"
import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML } from "../types"

const importPresentationFromYAML = (
  context: ConfigurationContext,
  value: MetadataFormChoiceListValueYAML["Представление"]
): I8nText | undefined => {
  if (value === "") return undefined
  return importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value })
}

export const importFormChoiceListFromYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValueYAML
): MetadataFormChoiceListValue => {
  const value =
    data.Значение === undefined ? undefined : importMetadataValueFromYAML(context, undefined, data.Значение)

  return {
    type: "formChoiceListDesTimeValue",
    presentation: importPresentationFromYAML(context, data.Представление),
    value,
  }
}
