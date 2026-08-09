export interface MobileApplicationPermissionContext {
  defaultLanguage: string
}

export interface MobileApplicationPermissionDescription {
  items: Record<string, string>
}

export type MobileApplicationPermissionDescriptionYAML = string | Record<string, string>

export const MobileApplicationPermissionDescriptionJSONSchema = Type.Union([
  Type.String(),
  Type.Record(Type.String(), Type.String()),
])

export interface MobileApplicationPermissionDescriptionXML {
  "v8:item"?:
    | { "v8:lang": string; "v8:content": string }
    | Array<{ "v8:lang": string; "v8:content": string }>
}

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const importMobileApplicationPermissionDescriptionFromXML = (
  _context: MobileApplicationPermissionContext,
  value: MobileApplicationPermissionDescriptionXML | ""
): MobileApplicationPermissionDescription => ({
  items:
    value === ""
      ? {}
      : Object.fromEntries(
          normalizeArray(value["v8:item"]).map((item) => [item["v8:lang"], String(item["v8:content"] ?? "")])
        ),
})

export const exportMobileApplicationPermissionDescriptionToXML = (
  context: MobileApplicationPermissionContext,
  value: MobileApplicationPermissionDescription
): MobileApplicationPermissionDescriptionXML => {
  const entries = Object.entries(value.items)
  const isEmpty = entries.every(([language, content]) => language === context.defaultLanguage && content === "")
  if (isEmpty) return {}

  const items = entries.map(([language, content]) => ({
    "v8:lang": language,
    "v8:content": content,
  }))
  return { "v8:item": items }
}

export const importMobileApplicationPermissionDescriptionFromYAML = (
  context: MobileApplicationPermissionContext,
  value: MobileApplicationPermissionDescriptionYAML
): MobileApplicationPermissionDescription => ({
  items: typeof value === "string" ? { [context.defaultLanguage]: value } : value,
})

export const exportMobileApplicationPermissionDescriptionToYAML = (
  context: MobileApplicationPermissionContext,
  value: MobileApplicationPermissionDescription
): MobileApplicationPermissionDescriptionYAML => {
  const languages = Object.keys(value.items)
  if (languages.length === 0) return ""
  if (languages.length === 1 && value.items[context.defaultLanguage] !== undefined) {
    return value.items[context.defaultLanguage]
  }
  return value.items
}
import { Type } from "typebox"
