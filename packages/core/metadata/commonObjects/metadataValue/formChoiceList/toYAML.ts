import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML, MetadataTypedValue } from "../types"

export const exportFormChoiceListToYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueYAML => {
  const valueResult = exportMetadataValueToYAML(context, undefined, data.value as MetadataTypedValue | undefined)
  const presentationItems = data.presentation?.items
  const hasMultipleLanguages = presentationItems && Object.keys(presentationItems).length > 1
  const presentation = hasMultipleLanguages
    ? presentationItems
    : presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""

  const result: MetadataFormChoiceListValueYAML = {
    Представление: presentation,
  }

  if (valueResult !== undefined) result.Значение = valueResult

  return result
}
