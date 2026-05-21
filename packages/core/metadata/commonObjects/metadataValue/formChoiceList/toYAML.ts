import { ConfigurationContext } from "~/metadata/context/types"
import { exportI8nTextToYAML } from "../../i8nText/toYAML"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML, MetadataTypedValue } from "../types"

export const exportFormChoiceListToYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueYAML => {
  const valueResult = exportMetadataValueToYAML(context, undefined, data.value as MetadataTypedValue | undefined)
  const presentation = exportI8nTextToYAML({
    context,
    rule: { type: "I8nText" },
    value: data.presentation,
  }) ?? ""

  const result: MetadataFormChoiceListValueYAML = {
    Представление: presentation,
  }

  if (valueResult !== undefined) result.Значение = valueResult

  return result
}
