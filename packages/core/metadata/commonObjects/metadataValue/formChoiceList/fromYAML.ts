import { formulaFormatParser } from "~/metadata/helpers/formulaFormatParser/formulaFormatParser"
import { ConfigurationContext } from "~/metadata/context/types"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { importMetadataValueFromYAML } from "../fromYAML"
import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML } from "../types"

export const importFormChoiceListFromYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValueYAML
): MetadataFormChoiceListValue => {
  if (typeof data === "string") {
    const parsed = formulaFormatParser(data)
    const value = parsed.formula ? importMetadataValueFromYAML(context, undefined, parsed.formula) : undefined
    const presentation = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: parsed.parameters[0] })
    return { type: "formChoiceListDesTimeValue", presentation, value }
  }
  const value = importMetadataValueFromYAML(context, undefined, data.Значение)!
  return {
    type: "formChoiceListDesTimeValue",
    presentation: importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Представление }),
    value,
  }
}
