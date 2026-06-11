import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContextFromXML } from "../../../context/types"
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
  typeof fragment === "object" &&
  fragment !== null &&
  !Array.isArray(fragment) &&
  ((fragment as Record<string, unknown>)["_xsi:nil"] === true ||
    (fragment as Record<string, unknown>)["_xsi:nil"] === "true")

export const importParameterValueFromDcsXML = (
  context: ConfigurationContextFromXML,
  rule: SettingsParameterValuePropertyRule,
  xml: ParameterValueXML | SettingsParameterValueXML
): ParameterValue | SettingsParameterValue => {
  const dcsRule = toDcsMetadataValueRule(rule)
  const valueFragments = asArray(xml["dcscor:value"])
  const valueNodePresent = Object.prototype.hasOwnProperty.call(xml, "dcscor:value")
  const nilValuePresent = valueFragments.some(isNilValueFragment) || (valueNodePresent && valueFragments.length === 0)
  const valueParts = valueFragments
    .filter((fragment) => !isNilValueFragment(fragment))
    .map((fragment) => importDcsMetadataValueFromDcsXML(context, dcsRule, { "dcscor:value": fragment }))
  const value: ParameterValue["value"] =
    valueParts.length === 0 ? undefined : valueParts.length === 1 ? valueParts[0] : valueParts

  const itemsXml = asArray(xml["dcscor:item"])
  const item =
    itemsXml.length === 0 ? undefined : itemsXml.map((child) => importParameterValueFromDcsXML(context, rule, child))

  const use = parseUse(xml["dcscor:use"])
  const base: ParameterValue = {
    parameter: xml["dcscor:parameter"],
    ...(use !== undefined ? { use } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(item !== undefined ? { item } : {}),
    ...(context.fromXML.forReference && nilValuePresent ? { __referenceNilValue: true as const } : {}),
  }

  if (xml["_xsi:type"] === "dcsset:SettingsParameterValue") {
    const sx = xml as SettingsParameterValueXML
    return {
      ...base,
      ...(sx["dcsset:viewMode"] !== undefined ? { viewMode: sx["dcsset:viewMode"] } : {}),
      ...(sx["dcsset:userSettingID"] !== undefined ? { userSettingID: sx["dcsset:userSettingID"] } : {}),
      ...(sx["dcsset:userSettingPresentation"] !== undefined
        ? {
            userSettingPresentation: importUserSettingPresentationFromXML(
              context,
              sx["dcsset:userSettingPresentation"]
            ),
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

registerTypeRule("SettingsParameterValue", "importFromXML", importSettingsParameterValueFromDcsXMLForRule)
