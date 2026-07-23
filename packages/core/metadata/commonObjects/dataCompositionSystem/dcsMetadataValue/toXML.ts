import { exportColorToXML } from "../../color/toXML"
import { Color } from "../../color/types"
import { exportFontToXML } from "../../font/toXML"
import { Font } from "../../font/types"
import { exportFormattedI8nTextToXML } from "../../formattedI8nText/toXML"
import type { FormattedI8nText } from "../../formattedI8nText/types"
import { exportI8nTextToXML } from "../../i8nText/toXML"
import { I8nText } from "../../i8nText/types"
import { exportMetadataValueToXML } from "../../metadataValue/toXML"
import { MetadataValue } from "../../metadataValue/types"
import { exportToDcsXML as exportTypeLinkToDcsXML } from "../../typeLink/toDcsXML"
import { TypeLink } from "../../typeLink/types"
import { exportChoiceParameterLinksToDcsXML } from "../../сhoiceParameterLinks/toDcsXML"
import { ChoiceParameterLinks } from "../../сhoiceParameterLinks/types"
import { exportChoiceParameterToDcsXML } from "../../сhoiceParameters/toDcsXML"
import { ChoiceParameter } from "../../сhoiceParameters/types"
import type { PropertyRule } from "../../../orchestration/property/types"
import type { ExportToXMLFunctionNew } from "../../../orchestration/property/fn"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { exportSystemEnumerationToDcsXML } from "../../../systemEnumerations/toDcsXML"
import { SystemEnumerationPropertyRule } from "../../../systemEnumerations/types"
import { ConfigurationContext } from "../../../context/types"
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsExplicitTextValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueDcsRootXML,
  MetadataDcsSystemEnumerationValue,
} from "./types"

const isExplicitTextValue = (data: MetadataDcsMetadataValue): data is MetadataDcsExplicitTextValue =>
  data !== null &&
  typeof data === "object" &&
  "type" in data &&
  "value" in data &&
  (data.type === "DesignTimeValue" || data.type === "Field") &&
  typeof data.value === "string"

const isDcsSystemEnumerationValue = (data: MetadataDcsMetadataValue): data is MetadataDcsSystemEnumerationValue =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  "type" in data &&
  "typeSE" in data &&
  "value" in data &&
  data.type === "SystemEnumeration" &&
  typeof data.value === "string"

const isExplicitEmptyLocalStringType = (data: MetadataDcsMetadataValue): data is I8nText => {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false

  const keys = Object.keys(data)
  if (keys.length !== 1 || keys[0] !== "items") return false

  const items = (data as { items?: unknown }).items
  return typeof items === "object" && items !== null && !Array.isArray(items) && Object.keys(items).length === 0
}

const isI8nTextValue = (data: MetadataDcsMetadataValue): data is I8nText =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  "items" in data &&
  typeof (data as { items?: unknown }).items === "object" &&
  (data as { items?: unknown }).items !== null &&
  !Array.isArray((data as { items?: unknown }).items)

const isLocalFormattedStringTypeValue = (
  data: MetadataDcsMetadataValue
): data is { type: "LocalFormattedStringType"; value: FormattedI8nText } =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  (data as Record<string, unknown>).type === "LocalFormattedStringType" &&
  typeof (data as Record<string, unknown>).value === "object" &&
  (data as Record<string, unknown>).value !== null

export const exportDcsMetadataValueToDcsXML = (params: {
  context: ConfigurationContext
  rule: DcsMetadataValuePropertyRule
  data: MetadataDcsMetadataValue
}): MetadataDcsMetadataValueDcsRootXML => {
  const { context, rule, data } = params

  if (data === null) {
    return { "dcscor:value": { "_xsi:nil": true } as unknown as MetadataDcsMetadataValueDcsRootXML["dcscor:value"] }
  }
  if (data === undefined) {
    if (rule.exportNilValue) {
      return { "dcscor:value": { "_xsi:nil": true } as unknown as MetadataDcsMetadataValueDcsRootXML["dcscor:value"] }
    }
    return { "dcscor:value": undefined as unknown as MetadataDcsMetadataValueDcsRootXML["dcscor:value"] }
  }
  if (Array.isArray(data) && rule.valueType === "Primitive") {
    return {
      "dcscor:value": data.map(
        (item) =>
          exportDcsMetadataValueToDcsXML({
            context,
            rule,
            data: item,
          })["dcscor:value"]
      ) as MetadataDcsMetadataValueDcsRootXML["dcscor:value"],
    }
  }

  if (isExplicitTextValue(data)) {
    return {
      "dcscor:value": {
        "_xsi:type": `dcscor:${data.type}`,
        "#text": data.value,
      },
    }
  }

  if (isDcsSystemEnumerationValue(data)) {
    const out = exportSystemEnumerationToDcsXML(
      context,
      { type: "SystemEnumeration", typeSE: data.typeSE } as SystemEnumerationPropertyRule,
      data.value
    )
    if (!out) {
      throw new Error("DCS MetadataValue: cannot export empty inferred system enumeration")
    }
    return out
  }

  switch (rule.valueType) {
    case "Parameter":
      return exportChoiceParameterToDcsXML(context, undefined, data as ChoiceParameter)
    case "Field":
      if (typeof data === "object" && data !== null && "type" in (data as object) && "value" in (data as object)) {
        const inner = exportMetadataValueToXML({
          context,
          rule: { type: "MetadataValue", exportNilValue: true } as any,
          value: data as MetadataValue,
        }) as Record<string, unknown>
        return { "dcscor:value": inner }
      }
      return {
        "dcscor:value": {
          "_xsi:type": "dcscor:Field",
          "#text": data as string,
        },
      }
    case "DesignTimeValue": {
      // DesignTimeValue может быть I8nText (v8:LocalStringType) либо типизированным примитивом
      // (например xs:string/xs:decimal/xs:boolean). Различаем по форме объекта.
      if (isLocalFormattedStringTypeValue(data)) {
        const formattedXml = exportFormattedI8nTextToXML(context, { type: "FormattedI8nText" }, data.value)
        const items = formattedXml?.["v8:item"]
        return {
          "dcscor:value": {
            "_xsi:type": "v8:LocalFormattedStringType",
            ...(items !== undefined ? { "v8:lws": { "v8:item": items } } : {}),
            "v8:formatted": data.value.formatted,
          },
        }
      }
      if (isExplicitEmptyLocalStringType(data)) {
        return {
          "dcscor:value": {
            "_xsi:type": "v8:LocalStringType",
          },
        }
      }
      if (data !== null && typeof data === "object" && "type" in (data as object) && "value" in (data as object)) {
        const inner = exportMetadataValueToXML({
          context,
          rule: { type: "MetadataValue", exportNilValue: true } as any,
          value: data as MetadataValue,
        }) as Record<string, unknown>
        return {
          "dcscor:value": inner,
        }
      }
      if (typeof data === "string") {
        return {
          "dcscor:value": {
            "_xsi:type": "xs:string",
            "#text": data,
          },
        }
      }
      if (!isI8nTextValue(data)) {
        throw new Error("DCS MetadataValue: DesignTimeValue expects I8nText")
      }
      const i8nXml = exportI8nTextToXML(context, { type: "I8nText" }, data)
      return {
        "dcscor:value": {
          "_xsi:type": "v8:LocalStringType",
          ...(i8nXml ?? {}),
        },
      }
    }
    case "Color": {
      const colorText = exportColorToXML(context, undefined, data as Color)
      return {
        "dcscor:value": {
          "_xsi:type": "v8ui:Color",
          "#text": colorText ?? "",
        },
      }
    }
    case "Primitive": {
      const inner = exportMetadataValueToXML({
        context,
        rule: { type: "MetadataValue", exportNilValue: true } as any,
        value: data as MetadataValue,
      }) as Record<string, unknown>
      return {
        "dcscor:value": inner,
      }
    }
    case "TypeLink":
      return exportTypeLinkToDcsXML(context, undefined, data as TypeLink)
    case "ChoiceParameterLinks":
      return exportChoiceParameterLinksToDcsXML(context, undefined, data as ChoiceParameterLinks)
    case "SystemEnumeration": {
      if (rule.typeSE === undefined) {
        throw new Error("DCS MetadataValue: rule.typeSE is required for SystemEnumeration")
      }
      const out = exportSystemEnumerationToDcsXML(
        context,
        { type: "SystemEnumeration", typeSE: rule.typeSE } as SystemEnumerationPropertyRule,
        data as string
      )
      if (!out) {
        throw new Error("DCS MetadataValue: cannot export empty system enumeration")
      }
      return out
    }
    case "Font": {
      const fontXml = exportFontToXML(context, undefined, data as Font)
      return {
        "dcscor:value": {
          "_xsi:type": "v8ui:Font",
          ...(fontXml ?? {}),
        },
      }
    }
    default:
      throw new Error("DCS MetadataValue: unsupported valueType")
  }
}

export const exportDcsMetadataValueToXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  data: MetadataDcsMetadataValue
): MetadataDcsMetadataValueDcsRootXML["dcscor:value"] => {
  const root = exportDcsMetadataValueToDcsXML({
    context,
    rule: rule as unknown as DcsMetadataValuePropertyRule,
    data,
  })
  return root["dcscor:value"]
}

const exportDcsMetadataValueToXMLForRule: ExportToXMLFunctionNew = ({ context, rule, value, source }) => {
  const valueType = source?.raw("valueType")
  const normalizedValue =
    valueType === "УникальныйИдентификатор" &&
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).type === "string" &&
    typeof (value as Record<string, unknown>).value === "string"
      ? { type: "uuid", value: (value as Record<string, unknown>).value }
      : value
  return exportDcsMetadataValueToXML(context, rule, normalizedValue)
}

registerTypeRule("MetadataDcsMetadataValue", "exportToXML", exportDcsMetadataValueToXMLForRule)
