import { Type } from "typebox"
import { importBooleanFromXML } from "../../commonObjects/boolean/fromXML"
import { importBooleanFromYAML } from "../../commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "../../commonObjects/boolean/toYAML"
import { BooleanJSONSchema, StringboolYAML, StringboolXML } from "../../commonObjects/boolean/types"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import {
  exportRequiredMobileApplicationPermissionsToJSONSchema,
  exportRequiredMobileApplicationPermissionsToXML,
  exportRequiredMobileApplicationPermissionsToYAML,
  importRequiredMobileApplicationPermissionsFromXML,
  importRequiredMobileApplicationPermissionsFromYAML,
} from "./requiredMobileApplicationPermissions"
import {
  exportUsedMobileApplicationFunctionalitiesToJSONSchema,
  exportUsedMobileApplicationFunctionalitiesToXML,
  exportUsedMobileApplicationFunctionalitiesToYAML,
  importUsedMobileApplicationFunctionalitiesFromXML,
  importUsedMobileApplicationFunctionalitiesFromYAML,
} from "./usedMobileApplicationFunctionalities"

export interface MobileApplicationURL {
  baseUrl: string
  useAndroid: boolean
  useIOS: boolean
  useWindows: boolean
}

export type MobileApplicationURLs = MobileApplicationURL[]

export interface MobileApplicationURLYAML {
  baseUrl: string
  useAndroid: StringboolYAML
  useIOS: StringboolYAML
  useWindows: StringboolYAML
}

export type MobileApplicationURLsYAML = MobileApplicationURLYAML[]

type TextXML = string | { "#text"?: string }
type BooleanXML = StringboolXML | { "#text"?: StringboolXML; [key: string]: unknown }

interface MobileApplicationURLXML {
  "_xsi:type": "app:MobileApplicationURL"
  "app:baseUrl": TextXML
  "app:useAndroid": BooleanXML
  "app:useIOS": BooleanXML
  "app:useWindows": BooleanXML
}

interface MobileApplicationURLsXML {
  "v8:Value"?: MobileApplicationURLXML | MobileApplicationURLXML[]
}

export const MobileApplicationURLsJSONSchema = Type.Array(
  Type.Object({
    baseUrl: Type.String(),
    useAndroid: BooleanJSONSchema,
    useIOS: BooleanJSONSchema,
    useWindows: BooleanJSONSchema,
  })
)

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const text = (value: TextXML | undefined): string => {
  if (value === undefined) return ""
  return typeof value === "string" ? value : (value["#text"] ?? "")
}

export const importMobileApplicationURLsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: MobileApplicationURLsXML | "" | undefined
): MobileApplicationURLs | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return []

  return normalizeArray(xml["v8:Value"]).map((item) => ({
    baseUrl: text(item["app:baseUrl"]),
    useAndroid: importBooleanFromXML(context, undefined, item["app:useAndroid"]) ?? false,
    useIOS: importBooleanFromXML(context, undefined, item["app:useIOS"]) ?? false,
    useWindows: importBooleanFromXML(context, undefined, item["app:useWindows"]) ?? false,
  }))
}

export const exportMobileApplicationURLsToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MobileApplicationURLs | undefined
): MobileApplicationURLsXML | "" | undefined => {
  if (data === undefined) return undefined
  if (data.length === 0) return ""

  return {
    "v8:Value": data.map((item) => ({
      "_xsi:type": "app:MobileApplicationURL",
      "app:baseUrl": item.baseUrl,
      "app:useAndroid": item.useAndroid,
      "app:useIOS": item.useIOS,
      "app:useWindows": item.useWindows,
    })),
  }
}

export const importMobileApplicationURLsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: MobileApplicationURLsYAML | undefined
): MobileApplicationURLs | undefined => {
  if (yaml === undefined) return undefined

  return yaml.map((item) => ({
    baseUrl: item.baseUrl,
    useAndroid: importBooleanFromYAML(context, undefined, item.useAndroid) ?? false,
    useIOS: importBooleanFromYAML(context, undefined, item.useIOS) ?? false,
    useWindows: importBooleanFromYAML(context, undefined, item.useWindows) ?? false,
  }))
}

export const exportMobileApplicationURLsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MobileApplicationURLs | undefined
): MobileApplicationURLsYAML | undefined => {
  if (data === undefined) return undefined

  return data.map((item) => ({
    baseUrl: item.baseUrl,
    useAndroid: exportBooleanToYAML(context, undefined, item.useAndroid) ?? "Ложь",
    useIOS: exportBooleanToYAML(context, undefined, item.useIOS) ?? "Ложь",
    useWindows: exportBooleanToYAML(context, undefined, item.useWindows) ?? "Ложь",
  }))
}

export const exportMobileApplicationURLsToJSONSchema: ExportToJSONSchemaFn = () => MobileApplicationURLsJSONSchema

export const metadataPropertyRule000 = definePropertyTypeRule("MobileApplicationURLs", "importFromXML", importMobileApplicationURLsFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("MobileApplicationURLs", "exportToXML", exportMobileApplicationURLsToXML)
export const metadataPropertyRule002 = definePropertyTypeRule("MobileApplicationURLs", "importFromYAML", importMobileApplicationURLsFromYAML)
export const metadataPropertyRule003 = definePropertyTypeRule("MobileApplicationURLs", "exportToYAML", exportMobileApplicationURLsToYAML)
export const metadataPropertyRule004 = definePropertyTypeRule("MobileApplicationURLs", "exportToJSONSchema", exportMobileApplicationURLsToJSONSchema)
export const metadataPropertyRule005 = definePropertyTypeRule(
  "RequiredMobileApplicationPermissions",
  "importFromXML",
  importRequiredMobileApplicationPermissionsFromXML
)
export const metadataPropertyRule006 = definePropertyTypeRule(
  "RequiredMobileApplicationPermissions",
  "exportToXML",
  exportRequiredMobileApplicationPermissionsToXML
)
export const metadataPropertyRule007 = definePropertyTypeRule(
  "RequiredMobileApplicationPermissions",
  "importFromYAML",
  importRequiredMobileApplicationPermissionsFromYAML
)
export const metadataPropertyRule008 = definePropertyTypeRule(
  "RequiredMobileApplicationPermissions",
  "exportToYAML",
  exportRequiredMobileApplicationPermissionsToYAML
)
export const metadataPropertyRule009 = definePropertyTypeRule(
  "RequiredMobileApplicationPermissions",
  "exportToJSONSchema",
  exportRequiredMobileApplicationPermissionsToJSONSchema
)
export const metadataPropertyRule010 = definePropertyTypeRule(
  "UsedMobileApplicationFunctionalities",
  "importFromXML",
  importUsedMobileApplicationFunctionalitiesFromXML
)
export const metadataPropertyRule011 = definePropertyTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToXML",
  exportUsedMobileApplicationFunctionalitiesToXML
)
export const metadataPropertyRule012 = definePropertyTypeRule(
  "UsedMobileApplicationFunctionalities",
  "importFromYAML",
  importUsedMobileApplicationFunctionalitiesFromYAML
)
export const metadataPropertyRule013 = definePropertyTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToYAML",
  exportUsedMobileApplicationFunctionalitiesToYAML
)
export const metadataPropertyRule014 = definePropertyTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToJSONSchema",
  exportUsedMobileApplicationFunctionalitiesToJSONSchema
)
