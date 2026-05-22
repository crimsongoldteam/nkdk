import { ConfigurationContext } from "~/metadata/context/types"
import { DataCompositionComparisonTypeFromYAML } from "~/metadata/systemEnumerations/types"
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

const importExplicitChoiceListValueFromYAML = (
  value: unknown
): MetadataFormChoiceListValue["value"] | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const data = value as Record<string, unknown>
  if (data.Тип !== "ВидСравненияКомпоновкиДанных" || typeof data.Значение !== "string") return undefined
  const enumValue = DataCompositionComparisonTypeFromYAML[data.Значение as keyof typeof DataCompositionComparisonTypeFromYAML]
  if (enumValue === undefined) return undefined
  return {
    type: "DataCompositionComparisonType",
    value: enumValue,
  }
}

export const importFormChoiceListFromYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValueYAML
): MetadataFormChoiceListValue => {
  const value =
    data.Значение === undefined
      ? undefined
      : (importExplicitChoiceListValueFromYAML(data.Значение) ??
        importMetadataValueFromYAML(context, undefined, data.Значение))

  return {
    type: "formChoiceListDesTimeValue",
    presentation: importPresentationFromYAML(context, data.Представление),
    value,
  }
}
