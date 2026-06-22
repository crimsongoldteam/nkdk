import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML, MetadataTypedValue } from "../types"
import { exportFormChoiceListToYAML } from "../formChoiceList/toYAML"

const exportFixedArrayElementToYAML = (
  context: ConfigurationContext,
  value: MetadataTypedValue | undefined
): MetadataFixedArrayValueYAML[number] => {
  if (value === undefined) return undefined

  if (value.type === "formChoiceListDesTimeValue") {
    return {
      Тип: "ЗначениеСпискаВыбора",
      ...exportFormChoiceListToYAML(context, value),
    }
  }

  return exportMetadataValueToYAML(context, undefined, value) as MetadataFixedArrayValueYAML[number]
}

export const exportFixedArrayToYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueYAML =>
  data.value.map((v) => exportFixedArrayElementToYAML(context, v)) as MetadataFixedArrayValueYAML
