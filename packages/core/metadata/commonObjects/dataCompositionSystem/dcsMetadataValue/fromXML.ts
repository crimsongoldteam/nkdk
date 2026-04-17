import { importColorFromXML } from "~/metadata/commonObjects/color/fromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/fromXML"
import { FontXML } from "~/metadata/commonObjects/font/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { importMetadataValueFromXML } from "~/metadata/commonObjects/metadataValue/fromXML"
import { MetadataValueTypeFromXML, MetadataValueTypeXML } from "~/metadata/commonObjects/metadataValue/types"
import { importFromDcsXML as importTypeLinkFromDcsXML } from "~/metadata/commonObjects/typeLink/fromDcsXML"
import { TypeLinkDcsValueRootXML } from "~/metadata/commonObjects/typeLink/types"
import { importChoiceParameterLinksFromDcsXML } from "~/metadata/commonObjects/сhoiceParameterLinks/fromDcsXML"
import { ChoiceParameterLinkDcsValueRootXML } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { importChoiceParameterFromDcsXML } from "~/metadata/commonObjects/сhoiceParameters/fromDcsXML"
import { ChoiceParameterDcsValueRootXML } from "~/metadata/commonObjects/сhoiceParameters/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { SystemEnumerationDcsValueRootXML } from "~/metadata/systemEnumerations/dcsTypes"
import { importSystemEnumerationFromDcsXML } from "~/metadata/systemEnumerations/fromDcsXML"
import { SystemEnumerationPropertyRule, SystemEnumerationTypeMap } from "~/metadata/systemEnumerations/types"
import { ConfigurationContextFromXML } from "../../../context/types"
import { DcsMetadataValuePropertyRule, MetadataDcsMetadataValue, MetadataDcsMetadataValueDcsRootXML } from "./types"

const textNode = (value: string | { "#text"?: string } | undefined): string => {
  if (value === undefined) {
    throw new Error("DCS MetadataValue: expected text value")
  }
  if (typeof value === "string") {
    return value
  }
  const t = value["#text"]
  if (typeof t === "string") {
    return t
  }
  throw new Error("DCS MetadataValue: invalid text node")
}

const getXsiType = (root: unknown): string | undefined => {
  if (typeof root === "object" && root !== null && "_xsi:type" in root) {
    return String((root as { "_xsi:type": string })["_xsi:type"])
  }
  return undefined
}

const hasSystemEnumeration = (
  rule: DcsMetadataValuePropertyRule
): rule is DcsMetadataValuePropertyRule & { valueType: "SystemEnumeration"; typeSE: keyof SystemEnumerationTypeMap } =>
  rule.valueType === "SystemEnumeration" && rule.typeSE !== undefined

export const importDcsMetadataValueFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataValuePropertyRule,
  xml: MetadataDcsMetadataValueDcsRootXML
): MetadataDcsMetadataValue => {
  const root = xml["dcscor:value"]
  if (root === undefined) {
    throw new Error("DCS MetadataValue: missing dcscor:value")
  }

  if (typeof root === "string") {
    if (!hasSystemEnumeration(rule)) {
      throw new Error("DCS MetadataValue: string dcscor:value requires rule.typeSE for system enumeration")
    }
    return importSystemEnumerationFromDcsXML(
      context,
      { type: "SystemEnumeration", typeSE: rule.typeSE } as SystemEnumerationPropertyRule,
      xml as SystemEnumerationDcsValueRootXML
    )
  }

  const xsi = getXsiType(root)

  if (xsi === "dcscor:TypeLink") {
    return importTypeLinkFromDcsXML(context, rule as unknown as PropertyRule, xml as TypeLinkDcsValueRootXML)
  }

  if (xsi === "dcscor:ChoiceParameterLinks") {
    return importChoiceParameterLinksFromDcsXML(
      context,
      rule as unknown as PropertyRule,
      xml as ChoiceParameterLinkDcsValueRootXML
    )
  }

  if (xsi === "dcscor:ChoiceParameters") {
    return importChoiceParameterFromDcsXML(
      context,
      rule as unknown as PropertyRule,
      xml as ChoiceParameterDcsValueRootXML
    )
  }

  if (xsi === "dcscor:DesignTimeValue") {
    return {
      items: { ru: textNode(root as string | { "#text"?: string }) },
    }
  }

  if (xsi === "v8:LocalStringType") {
    return importI8nTextFromXML(context, { type: "I8nText" }, root as I8nTextXML)!
  }

  if (xsi === "v8ui:Color") {
    return importColorFromXML(context, undefined, textNode(root as string | { "#text"?: string }))!
  }

  if (xsi === "v8ui:Font") {
    const { "_xsi:type": _omit, ...rest } = root as Record<string, unknown> & { "_xsi:type": string }
    return importFontFromXML(context, undefined, rest as unknown as FontXML)!
  }

  if (xsi === "dcscor:Field") {
    return textNode(root as string | { "#text"?: string })
  }

  const metadataPrimitive = xsi !== undefined ? MetadataValueTypeFromXML(xsi as MetadataValueTypeXML) : undefined
  if (metadataPrimitive !== undefined) {
    return importMetadataValueFromXML({
      context,
      rule: { type: "MetadataValue" },
      value: root,
    }) as MetadataDcsMetadataValue
  }

  if (hasSystemEnumeration(rule)) {
    return importSystemEnumerationFromDcsXML(
      context,
      { type: "SystemEnumeration", typeSE: rule.typeSE } as SystemEnumerationPropertyRule,
      xml as SystemEnumerationDcsValueRootXML
    )
  }

  throw new Error(`DCS MetadataValue: unsupported xsi:type ${String(xsi)}`)
}

const isDcsMetadataValueRootXml = (value: unknown): value is MetadataDcsMetadataValueDcsRootXML =>
  typeof value === "object" && value !== null && !Array.isArray(value) && "dcscor:value" in value

const importDcsMetadataValueFromXMLForRule: (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  value: unknown
) => MetadataDcsMetadataValue | undefined = (context, rule, value) => {
  if (value === undefined || value === null) return undefined
  const xml: MetadataDcsMetadataValueDcsRootXML = isDcsMetadataValueRootXml(value)
    ? value
    : { "dcscor:value": value as MetadataDcsMetadataValueDcsRootXML["dcscor:value"] }
  return importDcsMetadataValueFromDcsXML(context, rule as unknown as DcsMetadataValuePropertyRule, xml)
}

registerTypeRule("MetadataDcsMetadataValue", "importFromXML", importDcsMetadataValueFromXMLForRule)
