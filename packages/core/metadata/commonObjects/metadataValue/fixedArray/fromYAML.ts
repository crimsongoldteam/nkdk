import { ConfigurationContext } from "~/metadata/context/types"
import { asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"
import { importMetadataValueFromYAML } from "../fromYAML"
import {
  MetadataExplicitFormChoiceListValueYAML,
  MetadataFixedArrayValue,
  MetadataFixedArrayValueYAMLInput,
  MetadataFormChoiceListValueYAML,
} from "../types"
import { importFormChoiceListFromYAML } from "../formChoiceList/fromYAML"

const isExplicitFormChoiceListValueYAML = (
  value: Exclude<MetadataFixedArrayValueYAMLInput[number], null | undefined>
): value is MetadataExplicitFormChoiceListValueYAML =>
  typeof value === "object" &&
  !Array.isArray(value) &&
  value !== null &&
  (value as Record<string, unknown>).Тип === "ЗначениеСпискаВыбора"

export const importFixedArrayFromYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValueYAMLInput
): MetadataFixedArrayValue => ({
  type: "fixedArray",
  value: data.map((v, index) => {
    if (v === undefined || v === null) return undefined

    const value = asExplicitYAMLStringIfMarked(
      data,
      index,
      v
    ) as Exclude<MetadataFixedArrayValueYAMLInput[number], null | undefined>

    if (isExplicitFormChoiceListValueYAML(value)) {
      const { Тип: _type, ...formChoiceListValue } = value
      return importFormChoiceListFromYAML(context, formChoiceListValue as MetadataFormChoiceListValueYAML)
    }

    return importMetadataValueFromYAML(context, undefined, value)!
  }),
})
