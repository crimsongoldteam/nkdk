import { importColorFromYAML } from "~/metadata/commonObjects/color/fromYAML"
import { importFontFromYAML } from "~/metadata/commonObjects/font/fromYAML"
import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { importMetadataFieldFromYAML } from "~/metadata/commonObjects/metadataField/fromYAML"
import { importMetadataValueStringFromYAML } from "~/metadata/commonObjects/metadataPath/fromYAML"
import { importMetadataValueFromYAML } from "~/metadata/commonObjects/metadataValue/fromYAML"
import { importTypeLinkFromYAML } from "~/metadata/commonObjects/typeLink/fromYAML"
import { importChoiceParameterLinksFromYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/fromYAML"
import { importChoiceParametersFromYAML } from "~/metadata/commonObjects/сhoiceParameters/fromYAML"
import { ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importSystemEnumerationFromYAMLDeprecated } from "~/metadata/systemEnumerations/fromYAML"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../../context/types"
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsMetadataSingleValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueYAML,
} from "./types"

const isEnumValueMetadataPath = (value: string | undefined): boolean =>
  value !== undefined && value.startsWith("Enum.") && value.split(".").includes("EnumValue")

const isEnterpriseDesignTimeValue = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("Перечисление.")

export const importDcsMetadataValueFromYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataValuePropertyRule,
  data: MetadataDcsMetadataValueYAML | undefined
): MetadataDcsMetadataValue | null | undefined => {
  if (data === undefined) return undefined
  if (data === null) return null
  if (Array.isArray(data) && rule.valueType === "Primitive") {
    return data
      .map((item) => importDcsMetadataValueFromYAML(context, rule, item))
      .filter((value): value is MetadataDcsMetadataSingleValue => value !== undefined && !Array.isArray(value))
  }

  switch (rule.valueType) {
    case "Color":
      return importColorFromYAML(context, undefined, data as any)!
    case "Field": {
      const metadataValuePath =
        typeof data === "string" && !data.startsWith(".")
          ? importMetadataValueStringFromYAML(context, undefined, data)
          : undefined
      if (typeof data === "string" && isEnumValueMetadataPath(metadataValuePath)) {
        return { type: "DesignTimeValue", value: data }
      }
      return importMetadataFieldFromYAML(context, undefined, data as any)!
    }
    case "Parameter": {
      const list = importChoiceParametersFromYAML(context, undefined, data as ChoiceParametersYAML)
      return list?.[0]
    }
    case "DesignTimeValue":
      if (typeof data === "string" && /^".*"$/.test(data)) {
        return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
      }
      if (typeof data === "object" && data !== null && "type" in data && "value" in data) {
        return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
      }
      return importI8nTextFromYAML({
        context,
        rule: { type: "I8nText" },
        value: data as I8nTextYAML,
      })!
    case "Primitive":
      if (isEnterpriseDesignTimeValue(data)) {
        return { type: "DesignTimeValue", value: data }
      }
      return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
    case "TypeLink":
      return importTypeLinkFromYAML(context, undefined, data as any)!
    case "ChoiceParameterLinks":
      return importChoiceParameterLinksFromYAML(context, undefined, data as any)!
    case "SystemEnumeration": {
      if (rule.typeSE === undefined) {
        throw new Error("MetadataDcsMetadataValue YAML: rule.typeSE is required for SystemEnumeration")
      }
      return importSystemEnumerationFromYAMLDeprecated(
        context,
        { type: "SystemEnumeration", typeSE: rule.typeSE } as SystemEnumerationPropertyRule,
        data as string
      ) as string
    }
    case "Font":
      return importFontFromYAML(context, undefined, data as any)!
    default:
      throw new Error("MetadataDcsMetadataValue YAML: unsupported valueType")
  }
}

const importDcsMetadataValueFromYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): MetadataDcsMetadataValue | undefined =>
  importDcsMetadataValueFromYAML(
    context,
    rule as DcsMetadataValuePropertyRule,
    value as MetadataDcsMetadataValueYAML
  ) as MetadataDcsMetadataValue | undefined

registerTypeRule("MetadataDcsMetadataValue", "importFromYAML", importDcsMetadataValueFromYAMLForRule)
