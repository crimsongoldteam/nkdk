import { importColorFromXML } from "../../color/fromXML"
import { importFontFromXML } from "../../font/fromXML"
import { FontXML } from "../../font/types"
import { importFormattedI8nTextFromXML } from "../../formattedI8nText/fromXML"
import { FormattedI8nTextXML } from "../../formattedI8nText/types"
import { importI8nTextFromXML } from "../../i8nText/fromXML"
import { I8nTextXML } from "../../i8nText/types"
import { importMetadataValueFromXML } from "../../metadataValue/fromXML"
import { MetadataValueTypeFromXML, MetadataValueTypeXML } from "../../metadataValue/types"
import { importFromDcsXML as importTypeLinkFromDcsXML } from "../../typeLink/fromDcsXML"
import { TypeLinkDcsValueRootXML } from "../../typeLink/types"
import { importChoiceParameterLinksFromDcsXML } from "../../сhoiceParameterLinks/fromDcsXML"
import { ChoiceParameterLinkDcsValueRootXML } from "../../сhoiceParameterLinks/types"
import { importChoiceParameterFromDcsXML } from "../../сhoiceParameters/fromDcsXML"
import { ChoiceParameterDcsValueRootXML } from "../../сhoiceParameters/types"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import { SystemEnumerationDcsValueRootXML } from "../../../systemEnumerations/dcsTypes"
import { importSystemEnumerationFromDcsXML } from "../../../systemEnumerations/fromDcsXML"
import * as SystemEnumerations from "../../../systemEnumerations/types"
import type { SystemEnumerationPropertyRule, SystemEnumerationTypeMap } from "../../../systemEnumerations/types"
import { ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { readDcsText } from "../../dcsText"
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsMetadataSingleValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueDcsRootXML,
} from "./types"

const textNode = (value: unknown): string =>
  readDcsText(value, "DCS MetadataValue: expected text value", "DCS MetadataValue: invalid text node")

const maybeTextNode = (value: string | { "#text"?: unknown } | XmlElementNode | undefined): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "string") return value
  if (isXmlElementNode(value)) return value.content.some(node => node.type === "text") ? xmlTextValue(value) : undefined
  const text = value["#text"]
  return typeof text === "string" ? text : undefined
}

const getXsiType = (root: unknown): string | undefined => {
  if (isXmlElementNode(root)) return xmlAttributeValue(root, "xsi:type")
  if (typeof root === "object" && root !== null && "_xsi:type" in root) {
    return String((root as { "_xsi:type": string })["_xsi:type"])
  }
  return undefined
}

const isNilValue = (root: unknown): boolean =>
  isXmlElementNode(root) ? xmlAttributeValue(root, "xsi:nil") === "true" : typeof root === "object" &&
  root !== null &&
  ((root as Record<string, unknown>)["_xsi:nil"] === true || (root as Record<string, unknown>)["_xsi:nil"] === "true")

const getUndefinedTypePrefix = (root: unknown): string | undefined => {
  if (typeof root !== "object" || root === null || getXsiType(root) !== "v8:Type") {
    return undefined
  }

  const text = isXmlElementNode(root) ? xmlTextValue(root) : (root as Record<string, unknown>)["#text"]
  if (typeof text !== "string") {
    return undefined
  }

  const parts = text.split(":")
  if (parts.length !== 2) {
    return undefined
  }

  const [prefix, name] = parts
  return prefix !== "" && name === "Undefined" ? prefix : undefined
}

const hasSystemEnumeration = (
  rule: DcsMetadataValuePropertyRule
): rule is DcsMetadataValuePropertyRule & { valueType: "SystemEnumeration"; typeSE: keyof SystemEnumerationTypeMap } =>
  rule.valueType === "SystemEnumeration" && rule.typeSE !== undefined

const inferEntSystemEnumerationType = (xsi: string | undefined): keyof SystemEnumerationTypeMap | undefined => {
  if (xsi === undefined || !xsi.startsWith("ent:")) return undefined

  const typeName = xsi.slice("ent:".length)
  const yamlMapName = `${typeName}ToYAML`
  return Object.prototype.hasOwnProperty.call(SystemEnumerations, yamlMapName)
    ? (typeName as keyof SystemEnumerationTypeMap)
    : undefined
}

const importDcsMetadataValueFromDcsXMLInternal = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataValuePropertyRule,
  xml: MetadataDcsMetadataValueDcsRootXML | XmlElementNode
): MetadataDcsMetadataValue | undefined => {
  const elements = isXmlElementNode(xml) && xml.name !== "dcscor:value" ? xmlElementChildren(xml, "dcscor:value") : undefined
  const root = isXmlElementNode(xml) ? elements === undefined ? xml : elements.length <= 1 ? elements[0] : elements : xml["dcscor:value"]
  if (root === undefined || isXmlElementNode(root) && isEmptyXmlElement(root)) {
    throw new Error("DCS MetadataValue: missing dcscor:value")
  }

  if (Array.isArray(root)) {
    const values = root
      .map((item) =>
        importDcsMetadataValueFromDcsXMLInternal(context, rule, isXmlElementNode(item) ? item : {
          "dcscor:value": item,
        } as MetadataDcsMetadataValueDcsRootXML)
      )
      .filter((value): value is MetadataDcsMetadataSingleValue => value !== undefined)

    return values.length > 0 ? values : undefined
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

  if (isNilValue(root)) {
    return null
  }

  if (xsi === "dcscor:TypeLink") {
    return importTypeLinkFromDcsXML(context, rule as unknown as PropertyRule, xml as TypeLinkDcsValueRootXML | XmlElementNode)
  }

  if (xsi === "dcscor:ChoiceParameterLinks") {
    return importChoiceParameterLinksFromDcsXML(
      context,
      rule as unknown as PropertyRule,
      xml as ChoiceParameterLinkDcsValueRootXML | XmlElementNode
    )
  }

  if (xsi === "dcscor:ChoiceParameters") {
    return importChoiceParameterFromDcsXML(
      context,
      rule as unknown as PropertyRule,
      xml as ChoiceParameterDcsValueRootXML | XmlElementNode
    )
  }

  if (xsi === "dcscor:DesignTimeValue") {
    const text = maybeTextNode(root as string | { "#text"?: unknown } | XmlElementNode)
    if (text !== undefined) {
      return { type: "DesignTimeValue", value: text }
    }

    const i8nText = importI8nTextFromXML(context, { type: "I8nText" }, root as I8nTextXML | XmlElementNode)
    if (i8nText !== undefined) return i8nText

    throw new Error("DCS MetadataValue: invalid DesignTimeValue")
  }

  if (xsi === "v8:LocalStringType") {
    return importI8nTextFromXML(context, { type: "I8nText" }, root as I8nTextXML | XmlElementNode) ?? { items: {} }
  }

  if (xsi === "v8:LocalFormattedStringType") {
    if (isXmlElementNode(root)) {
      const localized = importI8nTextFromXML(context, { type: "I8nText" }, xmlElementChildren(root, "v8:lws")[0])
      const formattedNode = xmlElementChildren(root, "v8:formatted")[0]
      if (localized === undefined && formattedNode === undefined) throw new Error("DCS MetadataValue: invalid LocalFormattedStringType")
      return {
        type: "LocalFormattedStringType",
        value: { formatted: formattedNode !== undefined && xmlTextValue(formattedNode) === "true", items: localized?.items ?? {} },
      }
    }
    const formatted = importFormattedI8nTextFromXML(context, { type: "FormattedI8nText" }, {
      _formatted: (root as Record<string, unknown>)["v8:formatted"] as never,
      "v8:item":
        (root as Record<string, unknown>)["v8:lws"] !== undefined
          ? ((root as Record<string, unknown>)["v8:lws"] as Record<string, unknown>)["v8:item"]
          : undefined,
    } as FormattedI8nTextXML)

    if (formatted === undefined) {
      throw new Error("DCS MetadataValue: invalid LocalFormattedStringType")
    }

    return {
      type: "LocalFormattedStringType",
      value: formatted,
    }
  }

  if (xsi === "v8ui:Color") {
    return importColorFromXML(context, undefined, textNode(root))!
  }

  if (xsi === "v8ui:Font") {
    return importFontFromXML(context, undefined, isXmlElementNode(root) ? root : root as unknown as FontXML)!
  }

  if (xsi === "dcscor:Field") {
    const value = textNode(root)
    return rule.valueType === "DesignTimeValue" ? { type: "Field", value } : value
  }

  const metadataPrimitive = xsi !== undefined ? MetadataValueTypeFromXML(xsi as MetadataValueTypeXML) : undefined
  const undefinedTypePrefix = getUndefinedTypePrefix(root)
  if (undefinedTypePrefix !== undefined && rule.valueType === "Primitive") {
    return null
  }

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

  const inferredTypeSE = inferEntSystemEnumerationType(xsi)
  if (inferredTypeSE !== undefined) {
    const value = importSystemEnumerationFromDcsXML(
      context,
      { type: "SystemEnumeration", typeSE: inferredTypeSE } as SystemEnumerationPropertyRule,
      xml as SystemEnumerationDcsValueRootXML
    )
    return { type: "SystemEnumeration", typeSE: inferredTypeSE, value }
  }

  throw new Error(`DCS MetadataValue: unsupported xsi:type ${String(xsi)} in ${isXmlElementNode(root) ? root.path : JSON.stringify(root)}`)
}

export const importDcsMetadataValueFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataValuePropertyRule,
  xml: MetadataDcsMetadataValueDcsRootXML | XmlElementNode
): MetadataDcsMetadataValue => {
  const result = importDcsMetadataValueFromDcsXMLInternal(context, rule, xml)
  if (result === undefined) {
    throw new Error("DCS MetadataValue: unexpected missing value")
  }

  return result
}

const isDcsMetadataValueRootXml = (value: unknown): value is MetadataDcsMetadataValueDcsRootXML =>
  typeof value === "object" && value !== null && !Array.isArray(value) && "dcscor:value" in value

const importDcsMetadataValueFromXMLForRule: (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  value: unknown
) => MetadataDcsMetadataValue | undefined = (context, rule, value) => {
  if (value === undefined || value === null) return null
  const xml: MetadataDcsMetadataValueDcsRootXML | XmlElementNode = isXmlElementNode(value) || isDcsMetadataValueRootXml(value)
    ? value
    : { "dcscor:value": value as MetadataDcsMetadataValueDcsRootXML["dcscor:value"] }
  return importDcsMetadataValueFromDcsXMLInternal(context, rule as unknown as DcsMetadataValuePropertyRule, xml)
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataDcsMetadataValue", "importFromXML", importDcsMetadataValueFromXMLForRule)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataDcsMetadataValue", "configurationIndexValueFromXML", {
})
