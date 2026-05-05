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

  if (valueResult === undefined) {
    const presentation = presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""
    return `(${presentation})`
  }

  if (hasMultipleLanguages && presentationItems) {
    return {
      Представление: presentationItems,
      Значение: valueResult,
    }
  }

  const presentation = presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""
  return `${valueResult}(${presentation})`
}
