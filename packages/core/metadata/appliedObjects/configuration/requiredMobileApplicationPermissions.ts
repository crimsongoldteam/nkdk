import { Type } from "typebox"
import {
  MobileApplicationPermissionBooleanJSONSchema,
  type MobileApplicationPermissionBooleanXML,
  type MobileApplicationPermissionBooleanYAML,
  exportMobileApplicationPermissionBooleanToYAML,
  importMobileApplicationPermissionBooleanFromXML,
  importMobileApplicationPermissionBooleanFromYAML,
} from "./mobileApplicationPermissionBoolean"
import {
  RequiredMobileApplicationPermissionsFromYAML,
  RequiredMobileApplicationPermissionsToYAML,
  type RequiredMobileApplicationPermissions,
  type RequiredMobileApplicationPermissionsYAML,
} from "./mobileApplicationPermissionsEnumerations"
import { literalUnionJSONSchema } from "./literalUnionJSONSchema"
import { EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS } from "./mobileApplicationPermissionsDefaults"
import {
  exportMobileApplicationPermissionDescriptionToXML,
  exportMobileApplicationPermissionDescriptionToYAML,
  importMobileApplicationPermissionDescriptionFromXML,
  importMobileApplicationPermissionDescriptionFromYAML,
  MobileApplicationPermissionDescriptionJSONSchema,
  type MobileApplicationPermissionContext,
  type MobileApplicationPermissionDescription,
  type MobileApplicationPermissionDescriptionXML,
  type MobileApplicationPermissionDescriptionYAML,
} from "./mobileApplicationPermissionDescription"

export interface RequiredMobileApplicationPermission {
  permission: RequiredMobileApplicationPermissions
  use: boolean
  description: MobileApplicationPermissionDescription
}

export type RequiredMobileApplicationPermissionCollection = RequiredMobileApplicationPermission[]

export interface RequiredMobileApplicationPermissionYAML {
  Разрешение: RequiredMobileApplicationPermissionsYAML
  Использовать: MobileApplicationPermissionBooleanYAML
  Описание: MobileApplicationPermissionDescriptionYAML
}

export type RequiredMobileApplicationPermissionCollectionYAML = RequiredMobileApplicationPermissionYAML[]

export { EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS } from "./mobileApplicationPermissionsDefaults"

interface RequiredMobileApplicationPermissionXML {
  "app:permission": RequiredMobileApplicationPermissions
  "app:use": MobileApplicationPermissionBooleanXML | { "#text"?: MobileApplicationPermissionBooleanXML }
  "app:description": MobileApplicationPermissionDescriptionXML | ""
}

interface RequiredMobileApplicationPermissionsXML {
  "app:permission"?: RequiredMobileApplicationPermissionXML | RequiredMobileApplicationPermissionXML[]
}

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const importRequiredMobileApplicationPermissionsFromXML = (
  context: MobileApplicationPermissionContext,
  _rule: unknown,
  xml: RequiredMobileApplicationPermissionsXML | "" | undefined
): RequiredMobileApplicationPermissionCollection | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS

  return normalizeArray(xml["app:permission"]).map((item) => ({
    permission: item["app:permission"],
    use: importMobileApplicationPermissionBooleanFromXML(item["app:use"]) ?? false,
    description: importMobileApplicationPermissionDescriptionFromXML(context, item["app:description"]),
  }))
}

export const exportRequiredMobileApplicationPermissionsToXML = (
  context: MobileApplicationPermissionContext,
  _rule: unknown,
  data: RequiredMobileApplicationPermissionCollection | undefined
): RequiredMobileApplicationPermissionsXML | "" | undefined => {
  if (data === undefined) return undefined
  if (data.length === 0) return ""

  return {
    "app:permission": data.map((item) => ({
      "app:permission": item.permission,
      "app:use": item.use,
      "app:description": exportMobileApplicationPermissionDescriptionToXML(context, item.description),
    })),
  }
}

export const importRequiredMobileApplicationPermissionsFromYAML = (
  context: MobileApplicationPermissionContext,
  _rule: unknown,
  yaml: RequiredMobileApplicationPermissionCollectionYAML | undefined
): RequiredMobileApplicationPermissionCollection | undefined => {
  if (yaml === undefined) return EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS

  return yaml.map((item) => ({
    permission: RequiredMobileApplicationPermissionsFromYAML[item.Разрешение],
    use: importMobileApplicationPermissionBooleanFromYAML(item.Использовать) ?? false,
    description: importMobileApplicationPermissionDescriptionFromYAML(context, item.Описание),
  }))
}

export const exportRequiredMobileApplicationPermissionsToYAML = (
  context: MobileApplicationPermissionContext,
  _rule: unknown,
  data: RequiredMobileApplicationPermissionCollection | undefined
): RequiredMobileApplicationPermissionCollectionYAML | undefined => {
  if (data === undefined) return undefined

  return data.map((item) => ({
    Разрешение: RequiredMobileApplicationPermissionsToYAML[item.permission],
    Использовать: exportMobileApplicationPermissionBooleanToYAML(item.use) ?? "Ложь",
    Описание: exportMobileApplicationPermissionDescriptionToYAML(context, item.description),
  }))
}

export const RequiredMobileApplicationPermissionsJSONSchema = Type.Array(
  Type.Object({
    Разрешение: literalUnionJSONSchema(Object.keys(RequiredMobileApplicationPermissionsFromYAML)),
    Использовать: MobileApplicationPermissionBooleanJSONSchema,
    Описание: MobileApplicationPermissionDescriptionJSONSchema,
  })
)

export const exportRequiredMobileApplicationPermissionsToJSONSchema = (_params?: unknown) =>
  RequiredMobileApplicationPermissionsJSONSchema
