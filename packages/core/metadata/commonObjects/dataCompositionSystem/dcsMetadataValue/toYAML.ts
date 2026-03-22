import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportColorToYAML } from "~/metadata/commonObjects/color/toYAML"
import { exportFontToYAML } from "~/metadata/commonObjects/font/toYAML"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { exportMetadataFieldToYAML } from "~/metadata/commonObjects/metadataField/toYAML"
import { exportMetadataValueToYAML } from "~/metadata/commonObjects/metadataValue/toYAML"
import { exportChoiceParametersToYAML } from "~/metadata/commonObjects/сhoiceParameters/toYAML"
import { ChoiceParameter } from "~/metadata/commonObjects/сhoiceParameters/types"
import { exportChoiceParameterLinksToYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/toYAML"
import { exportTypeLinkToYAML } from "~/metadata/commonObjects/typeLink/toYAML"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueYAML,
} from "./types"

export const exportDcsMetadataValueToYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataValuePropertyRule,
  data: MetadataDcsMetadataValue | undefined
): MetadataDcsMetadataValueYAML | undefined => {
  if (data === undefined) return undefined

  switch (rule.valueType) {
    case "Color":
      return exportColorToYAML(context, undefined, data as any)
    case "Field":
      return exportMetadataFieldToYAML(context, undefined, data as any)
    case "Parameter":
      return exportChoiceParametersToYAML(context, undefined, [data as ChoiceParameter])
    case "DesignTimeValue":
      return exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data as I8nText })
    case "Primitive":
      return exportMetadataValueToYAML(context, undefined, data as any)
    case "TypeLink":
      return exportTypeLinkToYAML(context, undefined, data as any)
    case "ChoiceParameterLinks":
      return exportChoiceParameterLinksToYAML(context, undefined, data as any)
    case "SystemEnumeration": {
      if (rule.typeSE === undefined) {
        throw new Error("MetadataDcsMetadataValue YAML: rule.typeSE is required for SystemEnumeration")
      }
      return exportSystemEnumerationToYAMLDeprecated(
        context,
        { type: "SystemEnumeration", typeSE: rule.typeSE } as SystemEnumerationPropertyRule,
        data as string
      )
    }
    case "Font":
      return exportFontToYAML(context, undefined, data as any)
    default: {
      const _exhaustive: never = rule.valueType
      throw new Error(`MetadataDcsMetadataValue YAML: unsupported valueType ${String(_exhaustive)}`)
    }
  }
}

const exportDcsMetadataValueToYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): MetadataDcsMetadataValueYAML | undefined =>
  exportDcsMetadataValueToYAML(context, rule as unknown as DcsMetadataValuePropertyRule, value as MetadataDcsMetadataValue)

registerTypeRule("MetadataDcsMetadataValue", "exportToYAML", exportDcsMetadataValueToYAMLForRule)
