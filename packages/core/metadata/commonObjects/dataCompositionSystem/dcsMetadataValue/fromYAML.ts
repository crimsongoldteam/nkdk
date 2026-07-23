import { importColorFromYAML } from "../../color/fromYAML"
import { importFontFromYAML } from "../../font/fromYAML"
import { importFormattedI8nTextFromYAML } from "../../formattedI8nText/fromYAML"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { I8nText, I8nTextYAML } from "../../i8nText/types"
import { importMetadataFieldFromYAML } from "../../metadataField/fromYAML"
import { importMetadataValueStringFromYAML } from "../../metadataPath/fromYAML"
import { MetadataFieldTypeFromYAML, MetadataTypeFromYAML } from "../../metadataPath/types"
import { importMetadataValueFromYAML } from "../../metadataValue/fromYAML"
import { importTypeLinkFromYAML } from "../../typeLink/fromYAML"
import { importChoiceParameterLinksFromYAML } from "../../сhoiceParameterLinks/fromYAML"
import { importChoiceParametersFromYAML } from "../../сhoiceParameters/fromYAML"
import { ChoiceParametersYAML } from "../../сhoiceParameters/types"
import type { PropertyRule } from "../../../orchestration/property/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { importSystemEnumerationFromYAMLDeprecated } from "../../../systemEnumerations/fromYAML"
import { SystemEnumerationPropertyRule } from "../../../systemEnumerations/types"
import type { ExplicitYAMLString } from "../../../../yaml/explicitString"
import { isExplicitYAMLString, unwrapExplicitYAMLString } from "../../../../yaml/explicitString"
import { ConfigurationContext } from "../../../context/types"
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsMetadataSingleValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueYAML,
  MetadataDcsSystemEnumerationValueYAML,
} from "./types"

const isEnumValueMetadataPath = (value: string | undefined): boolean =>
  value !== undefined && value.startsWith("Enum.") && value.split(".").includes("EnumValue")

const isEnterpriseDesignTimeValue = (value: unknown): value is string =>
  typeof value === "string" &&
  value.includes(".") &&
  (value.split(".")[0] in MetadataFieldTypeFromYAML || value.split(".")[0] in MetadataTypeFromYAML)

const isExplicitEmptyLocalStringType = (value: unknown): value is I8nText => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false

  const keys = Object.keys(value)
  if (keys.length !== 1 || keys[0] !== "items") return false

  const items = (value as { items?: unknown }).items
  return typeof items === "object" && items !== null && !Array.isArray(items) && Object.keys(items).length === 0
}

const hasExplicitTextType = (data: unknown): data is Record<string, unknown> =>
  typeof data === "object" && data !== null && !Array.isArray(data) && "Тип" in data

const importExplicitTextValueFromYAML = (
  context: ConfigurationContext,
  data: unknown
): MetadataDcsMetadataValue | undefined => {
  if (!hasExplicitTextType(data)) return undefined
  if (data["Тип"] === "Поле" && typeof data["Значение"] === "string") {
    return { type: "Field", value: data["Значение"] }
  }
  if (data["Тип"] === "ЗначениеВремениПроектирования" && typeof data["Значение"] === "string") {
    return { type: "DesignTimeValue", value: data["Значение"] }
  }
  if (data["Тип"] === "МногоязычнаяСтрока") {
    const value = importI8nTextFromYAML({
      context,
      rule: { type: "I8nText" },
      value: unwrapExplicitYAMLString(data["Значение"]) as I8nTextYAML,
    })
    if (value !== undefined) return value
  }
  if (data["Тип"] === "МногоязычнаяФорматированнаяСтрока") {
    const value = importFormattedI8nTextFromYAML({
      context,
      rule: { type: "FormattedI8nText" },
      value: data["Значение"] as never,
    })
    if (value !== undefined) return { type: "LocalFormattedStringType", value }
  }
  throw new Error("MetadataDcsMetadataValue YAML: invalid explicit text value")
}

const isDcsSystemEnumerationValueYAML = (data: unknown): data is MetadataDcsSystemEnumerationValueYAML =>
  typeof data === "object" &&
  data !== null &&
  !Array.isArray(data) &&
  (data as Record<string, unknown>)["Тип"] === "СистемноеПеречисление" &&
  typeof (data as Record<string, unknown>)["Имя"] === "string" &&
  typeof (data as Record<string, unknown>)["Значение"] === "string"

const isExplicitPrimitiveStringValueYAML = (
  data: unknown
): data is { Тип: "Строка"; Значение: string | ExplicitYAMLString } =>
  typeof data === "object" &&
  data !== null &&
  !Array.isArray(data) &&
  (data as Record<string, unknown>).Тип === "Строка" &&
  (typeof (data as Record<string, unknown>).Значение === "string" ||
    isExplicitYAMLString((data as Record<string, unknown>).Значение))

const isDateTimeYAML = (data: unknown): data is string =>
  typeof data === "string" && /^\d{2}\.\d{2}\.\d{4}(\s+\d{2}:\d{2}:\d{2})?$/.test(data)

const importPrimitiveMatchingSourceType = (
  context: ConfigurationContext,
  data: unknown,
  sourceValue: MetadataDcsMetadataValue | undefined
): MetadataDcsMetadataValue | undefined => {
  if (
    sourceValue === null ||
    typeof sourceValue !== "object" ||
    Array.isArray(sourceValue) ||
    typeof (sourceValue as { type?: unknown }).type !== "string"
  ) {
    return undefined
  }
  const imported = importMetadataValueFromYAML(context, undefined, data as never) as
    | MetadataDcsMetadataValue
    | undefined
  if (
    imported === null ||
    typeof imported !== "object" ||
    Array.isArray(imported) ||
    (imported as { type?: unknown }).type !== (sourceValue as { type: string }).type
  ) {
    return undefined
  }
  return imported
}

const importDcsSystemEnumerationValueFromYAML = (
  context: ConfigurationContext,
  data: MetadataDcsSystemEnumerationValueYAML
): MetadataDcsMetadataValue | undefined => {
  const value = importSystemEnumerationFromYAMLDeprecated(
    context,
    { type: "SystemEnumeration", typeSE: data["Имя"] } as SystemEnumerationPropertyRule,
    data["Значение"]
  )

  if (value === undefined) return undefined
  return {
    type: "SystemEnumeration",
    typeSE: data["Имя"],
    value,
  }
}

export const importDcsMetadataValueFromYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataValuePropertyRule,
  data: MetadataDcsMetadataValueYAML | undefined,
  sourceValue?: MetadataDcsMetadataValue
): MetadataDcsMetadataValue | null | undefined => {
  if (data === undefined && rule.valueType === "DesignTimeValue" && isExplicitEmptyLocalStringType(sourceValue)) {
    return sourceValue
  }
  if (data === undefined) return undefined
  if (data === null) return null
  if (rule.valueType === "Field" && isExplicitPrimitiveStringValueYAML(data)) {
    return { type: "string", value: unwrapExplicitYAMLString(data.Значение) as string }
  }
  if (Array.isArray(data) && rule.valueType === "Primitive") {
    return data
      .map((item) => importDcsMetadataValueFromYAML(context, rule, item))
      .filter((value): value is MetadataDcsMetadataSingleValue => value !== undefined && !Array.isArray(value))
  }

  switch (rule.valueType) {
    case "Color":
      return importColorFromYAML(context, undefined, data as any)!
    case "Field": {
      const sourceTypedPrimitive = importPrimitiveMatchingSourceType(context, data, sourceValue)
      if (sourceTypedPrimitive !== undefined) return sourceTypedPrimitive
      const metadataValuePath =
        typeof data === "string" && !data.startsWith(".")
          ? importMetadataValueStringFromYAML(context, undefined, data)
          : undefined
      if (typeof data === "string" && isEnumValueMetadataPath(metadataValuePath)) {
        return { type: "DesignTimeValue", value: data }
      }
      if (isDcsSystemEnumerationValueYAML(data)) {
        return importDcsSystemEnumerationValueFromYAML(context, data)
      }
      if (isDateTimeYAML(data)) {
        return importMetadataValueFromYAML(context, undefined, data) as MetadataDcsMetadataValue
      }
      if (typeof data !== "string") {
        return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
      }
      return importMetadataFieldFromYAML(context, undefined, data as any) ?? data
    }
    case "Parameter": {
      const list = importChoiceParametersFromYAML(context, undefined, data as ChoiceParametersYAML)
      return list?.[0]
    }
    case "DesignTimeValue": {
      const explicitTextValue = importExplicitTextValueFromYAML(context, data)
      if (explicitTextValue !== undefined) {
        return explicitTextValue
      }
      if (isExplicitYAMLString(data)) {
        return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
      }
      if (typeof data === "object" && data !== null && "type" in data && "value" in data) {
        return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
      }
      if (typeof data === "string") {
        return { type: "string", value: data }
      }
      return importI8nTextFromYAML({
        context,
        rule: { type: "I8nText" },
        value: data as I8nTextYAML,
      })!
    }
    case "Primitive":
      if (isDcsSystemEnumerationValueYAML(data)) {
        return importDcsSystemEnumerationValueFromYAML(context, data)
      }
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
  value: unknown,
  sourceValue?: unknown
): MetadataDcsMetadataValue | undefined =>
  importDcsMetadataValueFromYAML(
    context,
    rule as DcsMetadataValuePropertyRule,
    value as MetadataDcsMetadataValueYAML,
    sourceValue as MetadataDcsMetadataValue | undefined
  ) as MetadataDcsMetadataValue | undefined

registerTypeRule("MetadataDcsMetadataValue", "importFromYAML", importDcsMetadataValueFromYAMLForRule)
