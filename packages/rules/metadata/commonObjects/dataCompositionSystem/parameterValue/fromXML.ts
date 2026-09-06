import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContextFromXML, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { importDcsMetadataValueFromDcsXML } from "../dcsMetadataValue/fromXML"
import { toDcsMetadataValueRule } from "./dcsValueRule"
import { importUserSettingPresentationFromXML } from "./userSettingPresentationXML"
import type {
  ParameterValue,
  ParameterValueXML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueXML,
} from "./types"

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

const parseUse = (v: string | boolean | undefined): boolean | undefined => {
  if (v === undefined) return undefined
  if (typeof v === "boolean") return v
  const s = String(v).toLowerCase()
  if (s === "true" || s === "1") return true
  if (s === "false" || s === "0") return false
  return undefined
}

const isNilValueFragment = (fragment: unknown): boolean =>
  isXmlElementNode(fragment) ? xmlAttributeValue(fragment, "xsi:nil") === "true" : typeof fragment === "object" &&
  fragment !== null &&
  !Array.isArray(fragment) &&
  ((fragment as Record<string, unknown>)["_xsi:nil"] === true ||
    (fragment as Record<string, unknown>)["_xsi:nil"] === "true")

const isDcsAutoColorValueFragment = (rule: SettingsParameterValuePropertyRule, fragment: unknown): boolean =>
  rule.valueType === "Color" &&
  (isXmlElementNode(fragment)
    ? xmlAttributeValue(fragment, "xsi:type") === "v8ui:Color" && xmlTextValue(fragment) === "auto"
    : typeof fragment === "object" &&
  fragment !== null &&
  !Array.isArray(fragment) &&
  (fragment as Record<string, unknown>)["_xsi:type"] === "v8ui:Color" &&
  (fragment as Record<string, unknown>)["#text"] === "auto")

const childText = (node: XmlElementNode, name: string): string | undefined => {
  const child = xmlElementChildren(node, name)[0]
  return child === undefined ? undefined : xmlTextValue(child) || undefined
}

export const importParameterValueFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: SettingsParameterValuePropertyRule,
  xml: ParameterValueXML | SettingsParameterValueXML | XmlElementNode
): ParameterValue | SettingsParameterValue => {
  const dcsRule = toDcsMetadataValueRule(rule)
  let valueFragments = isXmlElementNode(xml) ? xmlElementChildren(xml, "dcscor:value") : asArray(xml["dcscor:value"])
  const valueNodePresent = isXmlElementNode(xml) ? valueFragments.length > 0 : Object.prototype.hasOwnProperty.call(xml, "dcscor:value")
  const only = valueFragments.length === 1 ? valueFragments[0] : undefined
  if (isXmlElementNode(only) && only.attributes.length === 0 && !only.content.some(node => node.type === "element") && xmlTextValue(only) === "") valueFragments = []
  const nilValuePresent = valueFragments.some(isNilValueFragment) || (valueNodePresent && valueFragments.length === 0)
  const valueParts = valueFragments
    .filter((fragment) => !isNilValueFragment(fragment))
    .filter((fragment) => !isDcsAutoColorValueFragment(rule, fragment))
    .map((fragment) => importDcsMetadataValueFromDcsXML(context, dcsRule, isXmlElementNode(fragment) ? fragment : { "dcscor:value": fragment }))
  const value: ParameterValue["value"] =
    valueParts.length === 0 ? undefined : valueParts.length === 1 ? valueParts[0] : valueParts

  const itemsXml = isXmlElementNode(xml) ? xmlElementChildren(xml, "dcscor:item") : asArray(xml["dcscor:item"])
  const item =
    itemsXml.length === 0 ? undefined : itemsXml.map((child) => importParameterValueFromDcsXML(context, rule, child))

  const use = parseUse(isXmlElementNode(xml) ? childText(xml, "dcscor:use") : xml["dcscor:use"])
  const base: ParameterValue = {
    parameter: isXmlElementNode(xml) ? childText(xml, "dcscor:parameter") as string : xml["dcscor:parameter"],
    ...(use !== undefined ? { use } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(item !== undefined ? { item } : {}),
    ...(context.fromXML.forReference && nilValuePresent ? { __referenceNilValue: true as const } : {}),
  }

  if ((isXmlElementNode(xml) ? xmlAttributeValue(xml, "xsi:type") : xml["_xsi:type"]) === "dcsset:SettingsParameterValue") {
    const sx = xml as SettingsParameterValueXML
    const viewMode = isXmlElementNode(xml) ? childText(xml, "dcsset:viewMode") : sx["dcsset:viewMode"]
    const userSettingID = isXmlElementNode(xml) ? childText(xml, "dcsset:userSettingID") : sx["dcsset:userSettingID"]
    const presentationXml = isXmlElementNode(xml) ? xmlElementChildren(xml, "dcsset:userSettingPresentation")[0] : sx["dcsset:userSettingPresentation"]
    const presentation = importUserSettingPresentationFromXML(context, presentationXml)
    return {
      ...base,
      ...(viewMode !== undefined ? { viewMode } : {}),
      ...(userSettingID !== undefined ? { userSettingID } : {}),
      ...(presentation !== undefined
        ? {
            userSettingPresentation: presentation,
          }
        : {}),
    } as SettingsParameterValue
  }

  return base
}

const importSettingsParameterValueFromDcsXMLForRule = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  value: unknown
) =>
  importParameterValueFromDcsXML(
    context,
    rule as unknown as SettingsParameterValuePropertyRule,
    value as ParameterValueXML
  )

export const metadataPropertyRule000 = definePropertyTypeRule("SettingsParameterValue", "importFromXML", importSettingsParameterValueFromDcsXMLForRule)
