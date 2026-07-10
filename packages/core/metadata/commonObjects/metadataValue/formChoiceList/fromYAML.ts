import { ConfigurationContext } from "../../../context/types"
import { isMetadataRootName, rootFromYAML } from "../../metadataTargets"
import { DataCompositionComparisonTypeFromYAML } from "../../../systemEnumerations/types"
import { I8nText } from "../../i8nText/types"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { restoreExplicitMetadataValueYAMLString } from "../explicitYAMLString"
import { importMetadataValueFromYAML } from "../fromYAML"
import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML, MetadataStringValue } from "../types"

const importPresentationFromYAML = (
  context: ConfigurationContext,
  value: MetadataFormChoiceListValueYAML["Представление"]
): I8nText | undefined => {
  if (value === "") return undefined
  return importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value })
}

const importExplicitChoiceListValueFromYAML = (value: unknown): MetadataFormChoiceListValue["value"] | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const data = value as Record<string, unknown>
  if (data.Тип !== "ВидСравненияКомпоновкиДанных" || typeof data.Значение !== "string") return undefined
  const enumValue =
    DataCompositionComparisonTypeFromYAML[data.Значение as keyof typeof DataCompositionComparisonTypeFromYAML]
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
  const presentation = importPresentationFromYAML(context, data.Представление)
  const value =
    data.Значение === undefined
      ? undefined
      : (importExplicitChoiceListValueFromYAML(data.Значение) ??
        importChoiceListValueFromYAML(
          context,
          restoreExplicitMetadataValueYAMLString(
            data,
            "Значение",
            data.Значение
          ) as MetadataFormChoiceListValueYAML["Значение"]
        ))

  const result: MetadataFormChoiceListValue = {
    type: "formChoiceListDesTimeValue",
  }

  if (presentation !== undefined) result.presentation = presentation
  if (value !== undefined) result.value = value

  return result
}

const importChoiceListValueFromYAML = (
  context: ConfigurationContext,
  value: MetadataFormChoiceListValueYAML["Значение"]
): MetadataFormChoiceListValue["value"] | undefined => {
  if (typeof value === "string" && isMetadataObjectTargetOnly(value)) {
    return { type: "string", value } satisfies MetadataStringValue
  }

  try {
    return importMetadataValueFromYAML(context, undefined, value)
  } catch (caught) {
    if (typeof value !== "string" || isFullYAMLMetadataTarget(value)) throw caught

    return { type: "string", value } satisfies MetadataStringValue
  }
}

function isMetadataObjectTargetOnly(value: string): boolean {
  const parts = value.split(".")
  if (parts.length !== 2) return false
  const [root] = parts
  return rootFromYAML[root] !== undefined || isMetadataRootName(root)
}

function isFullYAMLMetadataTarget(value: string): boolean {
  const parts = value.split(".")
  const [root] = parts
  return parts.length > 1 && (rootFromYAML[root] !== undefined || isMetadataRootName(root))
}
