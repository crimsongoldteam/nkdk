import { exportColorToXML } from "~/metadata/commonObjects/color/toXML"
import { Color } from "~/metadata/commonObjects/color/types"
import { exportFontToXML } from "~/metadata/commonObjects/font/toXML"
import { Font } from "~/metadata/commonObjects/font/types"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { exportMetadataValueToXML } from "~/metadata/commonObjects/metadataValue/toXML"
import { MetadataValue } from "~/metadata/commonObjects/metadataValue/types"
import { exportToDcsXML as exportTypeLinkToDcsXML } from "~/metadata/commonObjects/typeLink/toDcsXML"
import { TypeLink } from "~/metadata/commonObjects/typeLink/types"
import { exportChoiceParameterLinksToDcsXML } from "~/metadata/commonObjects/сhoiceParameterLinks/toDcsXML"
import { ChoiceParameterLinks } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { exportChoiceParameterToDcsXML } from "~/metadata/commonObjects/сhoiceParameters/toDcsXML"
import { ChoiceParameter } from "~/metadata/commonObjects/сhoiceParameters/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportSystemEnumerationToDcsXML } from "~/metadata/systemEnumerations/toDcsXML"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
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
      const i8nXml = exportI8nTextToXML(context, { type: "I8nText" }, data as I8nText)
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

registerTypeRule("MetadataDcsMetadataValue", "exportToXML", exportDcsMetadataValueToXML)
