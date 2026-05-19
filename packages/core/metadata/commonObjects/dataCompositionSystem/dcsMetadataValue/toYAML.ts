import { exportColorToYAML } from "~/metadata/commonObjects/color/toYAML"
import { exportFontToYAML } from "~/metadata/commonObjects/font/toYAML"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { exportMetadataFieldToYAML } from "~/metadata/commonObjects/metadataField/toYAML"
import { exportMetadataFieldStringToYAML, exportMetadataValueStringToYAML } from "~/metadata/commonObjects/metadataPath/toYAML"
import { exportMetadataValueToYAML } from "~/metadata/commonObjects/metadataValue/toYAML"
import { exportTypeLinkToYAML } from "~/metadata/commonObjects/typeLink/toYAML"
import { exportChoiceParameterLinksToYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/toYAML"
import { exportChoiceParametersToYAML } from "~/metadata/commonObjects/сhoiceParameters/toYAML"
import { ChoiceParameter } from "~/metadata/commonObjects/сhoiceParameters/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../../context/types"
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsExplicitTextValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueYAML,
  MetadataDcsSystemEnumerationValue,
  MetadataDcsSystemEnumerationValueYAML,
} from "./types"

const isExplicitTextValue = (data: MetadataDcsMetadataValue): data is MetadataDcsExplicitTextValue =>
  data !== null &&
  typeof data === "object" &&
  "type" in data &&
  "value" in data &&
  (data.type === "DesignTimeValue" || data.type === "Field") &&
  typeof data.value === "string"

const isDcsSystemEnumerationValue = (
  data: MetadataDcsMetadataValue
): data is MetadataDcsSystemEnumerationValue =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  "type" in data &&
  "typeSE" in data &&
  "value" in data &&
  data.type === "SystemEnumeration" &&
  typeof data.value === "string"

const exportTypedValueToYAML = (
  context: ConfigurationContext,
  data: MetadataDcsMetadataValue
): MetadataDcsMetadataValueYAML | undefined => {
  if (isDcsSystemEnumerationValue(data)) {
    const value = exportSystemEnumerationToYAMLDeprecated(
      context,
      { type: "SystemEnumeration", typeSE: data.typeSE } as SystemEnumerationPropertyRule,
      data.value
    )
    if (value === undefined) return undefined
    return {
      Тип: "СистемноеПеречисление",
      Имя: data.typeSE,
      Значение: value,
    } satisfies MetadataDcsSystemEnumerationValueYAML
  }

  if (data !== null && typeof data === "object" && "type" in (data as object) && "value" in (data as object)) {
    return exportMetadataValueToYAML(context, undefined, data as any) as MetadataDcsMetadataValueYAML
  }

  return undefined
}

export const exportDcsMetadataValueToYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataValuePropertyRule,
  data: MetadataDcsMetadataValue | undefined
): MetadataDcsMetadataValueYAML | undefined => {
  if (data === undefined) return undefined
  if (data === null) return null as unknown as MetadataDcsMetadataValueYAML
  if (Array.isArray(data) && rule.valueType === "Primitive") {
    return data.map((item) =>
      exportDcsMetadataValueToYAML(context, rule, item)
    ) as MetadataDcsMetadataValueYAML
  }

  if (isExplicitTextValue(data)) {
    if (rule.valueType === "DesignTimeValue") {
      return {
        Тип: data.type === "Field" ? "Поле" : "ЗначениеВремениПроектирования",
        Значение: data.value,
      } as MetadataDcsMetadataValueYAML
    }

    if (data.type === "DesignTimeValue") {
      return (exportMetadataValueStringToYAML(context, undefined, data.value) ?? data.value) as MetadataDcsMetadataValueYAML
    }

    return (exportMetadataFieldStringToYAML(context, undefined, data.value) ?? data.value) as MetadataDcsMetadataValueYAML
  }

  switch (rule.valueType) {
    case "Color":
      return exportColorToYAML(context, undefined, data as any)
    case "Field": {
      const typedValue = exportTypedValueToYAML(context, data)
      if (typedValue !== undefined) return typedValue
      return exportMetadataFieldToYAML(context, undefined, data as any)
    }
    case "Parameter":
      return exportChoiceParametersToYAML(context, undefined, [data as ChoiceParameter])
    case "DesignTimeValue":
      if (data !== null && typeof data === "object" && "type" in (data as object) && "value" in (data as object)) {
        return exportMetadataValueToYAML(context, undefined, data as any)
      }
      if (typeof data === "string") return data as unknown as MetadataDcsMetadataValueYAML
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
    default:
      throw new Error("MetadataDcsMetadataValue YAML: unsupported valueType")
  }
}

const exportDcsMetadataValueToYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): MetadataDcsMetadataValueYAML | undefined =>
  exportDcsMetadataValueToYAML(
    context,
    rule as unknown as DcsMetadataValuePropertyRule,
    value as MetadataDcsMetadataValue
  )

registerTypeRule("MetadataDcsMetadataValue", "exportToYAML", exportDcsMetadataValueToYAMLForRule)
