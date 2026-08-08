import { Type } from "typebox"
import { importBooleanFromXML } from "../../commonObjects/boolean/fromXML"
import { importBooleanFromYAML } from "../../commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "../../commonObjects/boolean/toYAML"
import { BooleanJSONSchema, type StringboolXML, type StringboolYAML } from "../../commonObjects/boolean/types"
import {
  I8nTextJSONSchema,
  type I8nText,
  type I8nTextXML,
  type I8nTextYAML,
} from "../../commonObjects/i8nText/types"
import type { ConfigurationContext } from "../../context/types"
import { type ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"
import {
  RequiredMobileApplicationPermissionsFromYAML,
  RequiredMobileApplicationPermissionsToYAML,
  type RequiredMobileApplicationPermissions,
  type RequiredMobileApplicationPermissionsYAML,
} from "../../systemEnumerations/types"
import { literalUnionJSONSchema } from "./literalUnionJSONSchema"
import {
  exportMobileApplicationPermissionDescriptionToXML,
  exportMobileApplicationPermissionDescriptionToYAML,
  importMobileApplicationPermissionDescriptionFromXML,
  importMobileApplicationPermissionDescriptionFromYAML,
} from "./mobileApplicationPermissionDescription"

export interface RequiredMobileApplicationPermission {
  permission: RequiredMobileApplicationPermissions
  use: boolean
  description: I8nText
}

export type RequiredMobileApplicationPermissionCollection = RequiredMobileApplicationPermission[]

export interface RequiredMobileApplicationPermissionYAML {
  Разрешение: RequiredMobileApplicationPermissionsYAML
  Использовать: StringboolYAML
  Описание: I8nTextYAML
}

export type RequiredMobileApplicationPermissionCollectionYAML = RequiredMobileApplicationPermissionYAML[]

export const EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS: RequiredMobileApplicationPermissionCollection = []

interface RequiredMobileApplicationPermissionXML {
  "app:permission": RequiredMobileApplicationPermissions
  "app:use": StringboolXML | { "#text"?: StringboolXML }
  "app:description": I8nTextXML | ""
}

interface RequiredMobileApplicationPermissionsXML {
  "app:permission"?: RequiredMobileApplicationPermissionXML | RequiredMobileApplicationPermissionXML[]
}

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const importRequiredMobileApplicationPermissionsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: RequiredMobileApplicationPermissionsXML | "" | undefined
): RequiredMobileApplicationPermissionCollection | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS

  return normalizeArray(xml["app:permission"]).map((item) => ({
    permission: item["app:permission"],
    use: importBooleanFromXML(context, undefined, item["app:use"]) ?? false,
    description: importMobileApplicationPermissionDescriptionFromXML(context, item["app:description"]),
  }))
}

export const exportRequiredMobileApplicationPermissionsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: RequiredMobileApplicationPermissionCollectionYAML | undefined
): RequiredMobileApplicationPermissionCollection | undefined => {
  if (yaml === undefined) return EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS

  return yaml.map((item) => ({
    permission: RequiredMobileApplicationPermissionsFromYAML[item.Разрешение],
    use: importBooleanFromYAML(context, undefined, item.Использовать) ?? false,
    description: importMobileApplicationPermissionDescriptionFromYAML(context, item.Описание),
  }))
}

export const exportRequiredMobileApplicationPermissionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: RequiredMobileApplicationPermissionCollection | undefined
): RequiredMobileApplicationPermissionCollectionYAML | undefined => {
  if (data === undefined) return undefined

  return data.map((item) => ({
    Разрешение: RequiredMobileApplicationPermissionsToYAML[item.permission],
    Использовать: exportBooleanToYAML(context, undefined, item.use) ?? "Ложь",
    Описание: exportMobileApplicationPermissionDescriptionToYAML(context, item.description),
  }))
}

export const RequiredMobileApplicationPermissionsJSONSchema = Type.Array(
  Type.Object({
    Разрешение: literalUnionJSONSchema(Object.keys(RequiredMobileApplicationPermissionsFromYAML)),
    Использовать: BooleanJSONSchema,
    Описание: I8nTextJSONSchema,
  })
)

export const exportRequiredMobileApplicationPermissionsToJSONSchema: ExportToJSONSchemaFn = () =>
  RequiredMobileApplicationPermissionsJSONSchema

registerTypeRule(
  "RequiredMobileApplicationPermissions",
  "importFromXML",
  importRequiredMobileApplicationPermissionsFromXML
)
registerTypeRule(
  "RequiredMobileApplicationPermissions",
  "exportToXML",
  exportRequiredMobileApplicationPermissionsToXML
)
registerTypeRule(
  "RequiredMobileApplicationPermissions",
  "importFromYAML",
  importRequiredMobileApplicationPermissionsFromYAML
)
registerTypeRule(
  "RequiredMobileApplicationPermissions",
  "exportToYAML",
  exportRequiredMobileApplicationPermissionsToYAML
)
registerTypeRule(
  "RequiredMobileApplicationPermissions",
  "exportToJSONSchema",
  exportRequiredMobileApplicationPermissionsToJSONSchema
)
