import { Type } from "typebox"

export type MobileApplicationPermissionBooleanXML = boolean | "true" | "false"
export type MobileApplicationPermissionBooleanYAML = "Истина" | "Ложь"

export const MobileApplicationPermissionBooleanJSONSchema = Type.Union([
  Type.Literal("Истина"),
  Type.Literal("Ложь"),
])

export const importMobileApplicationPermissionBooleanFromXML = (
  value:
    | MobileApplicationPermissionBooleanXML
    | { "#text"?: MobileApplicationPermissionBooleanXML }
    | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  const raw = typeof value === "object" ? value["#text"] : value
  if (raw === true || raw === "true") return true
  if (raw === false || raw === "false") return false
  return undefined
}

export const importMobileApplicationPermissionBooleanFromYAML = (
  value: MobileApplicationPermissionBooleanYAML | undefined
): boolean | undefined => (value === undefined ? undefined : value === "Истина")

export const exportMobileApplicationPermissionBooleanToYAML = (
  value: boolean | undefined
): MobileApplicationPermissionBooleanYAML | undefined =>
  value === undefined ? undefined : value ? "Истина" : "Ложь"
