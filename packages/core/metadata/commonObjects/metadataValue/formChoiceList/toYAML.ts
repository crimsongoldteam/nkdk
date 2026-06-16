import { ConfigurationContext } from "~/metadata/context/types"
import { DataCompositionComparisonTypeToYAML } from "~/metadata/systemEnumerations/types"
import { exportI8nTextToYAML } from "../../i8nText/toYAML"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML, MetadataTypedValue } from "../types"

const exportExplicitChoiceListValueToYAML = (
  value: MetadataFormChoiceListValue["value"]
): MetadataFormChoiceListValueYAML["Значение"] | undefined => {
  if (value?.type !== "DataCompositionComparisonType") return undefined
  return {
    Тип: "ВидСравненияКомпоновкиДанных",
    Значение: DataCompositionComparisonTypeToYAML[
      value.value as keyof typeof DataCompositionComparisonTypeToYAML
    ],
  }
}

export const exportFormChoiceListToYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueYAML => {
  const valueResult =
    exportExplicitChoiceListValueToYAML(data.value) ??
    exportMetadataValueToYAML(context, undefined, data.value as MetadataTypedValue | undefined)
  const presentation = exportI8nTextToYAML({
    context,
    rule: { type: "I8nText" },
    value: data.presentation,
  })

  const result: MetadataFormChoiceListValueYAML = {}

  if (presentation !== undefined) result.Представление = presentation
  if (valueResult !== undefined) result.Значение = valueResult

  return result
}
