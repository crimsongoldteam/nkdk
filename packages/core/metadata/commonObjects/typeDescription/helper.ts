import * as SE from "~/metadata/systemEnumerations/types"
import { TypeDescriptionRule, TypeDescriptionRules } from "./types"

const systemEnumerationPrefix = "СистемноеПеречисление."
const fromYAMLSuffix = "FromYAML"
const toYAMLSuffix = "ToYAML"
const systemEnumerationYAMLNames: Record<string, string> = {
  FillChecking: "ПроверкаЗаполнения",
}

const isRecord = (value: unknown): value is Record<string, string> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const getSystemEnumerationFromYAMLMap = (type: string): Record<string, string> | undefined => {
  const map = (SE as Record<string, unknown>)[`${type}${fromYAMLSuffix}`]
  return isRecord(map) ? map : undefined
}

const getSystemEnumerationToYAMLMap = (type: string): Record<string, string> | undefined => {
  const map = (SE as Record<string, unknown>)[`${type}${toYAMLSuffix}`]
  return isRecord(map) ? map : undefined
}

export const getTypeDescriptionRule = (type: string): TypeDescriptionRule | undefined => {
  return TypeDescriptionRules[type]
}

export const getSystemEnumerationTypeDescriptionRule = (type: string): TypeDescriptionRule | undefined => {
  if (!isKnownSystemEnumerationType(type)) return undefined

  return {
    enterprise: type,
    prefix: "v8",
  }
}

export const getTypeDescriptionRuleOrSystemEnumeration = (type: string): TypeDescriptionRule | undefined => {
  return getTypeDescriptionRule(type) ?? getSystemEnumerationTypeDescriptionRule(type)
}

export const isKnownSystemEnumerationType = (type: string): boolean => {
  return getSystemEnumerationFromYAMLMap(type) !== undefined && getSystemEnumerationToYAMLMap(type) !== undefined
}

export const getSystemEnumerationYAMLType = (type: string): string | undefined => {
  if (!isKnownSystemEnumerationType(type)) return undefined

  const russianName = systemEnumerationYAMLNames[type]
  if (russianName === undefined || russianName.trim() === "") {
    return undefined
  }

  return `${systemEnumerationPrefix}${russianName}`
}

export const getSystemEnumerationTypeFromYAML = (type: string): string | undefined => {
  if (!type.startsWith(systemEnumerationPrefix)) return undefined

  const russianName = type.substring(systemEnumerationPrefix.length)
  if (russianName.trim() === "") return undefined

  for (const [typeName, systemEnumerationYAMLName] of Object.entries(systemEnumerationYAMLNames)) {
    if (systemEnumerationYAMLName !== russianName) continue
    if (isKnownSystemEnumerationType(typeName)) return typeName
  }

  return undefined
}

export const getTypeFromYAML = (enterprise: string): string | undefined => {
  const systemEnumerationType = getSystemEnumerationTypeFromYAML(enterprise)
  if (systemEnumerationType !== undefined) return systemEnumerationType

  for (const [type, rule] of Object.entries(TypeDescriptionRules)) {
    if (rule.enterprise === enterprise) {
      return type
    }
  }
  return undefined
}
