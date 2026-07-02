import { Type } from "@sinclair/typebox"
import { importBooleanFromXML } from "../../commonObjects/boolean/fromXML"
import { importBooleanFromYAML } from "../../commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "../../commonObjects/boolean/toYAML"
import { BooleanJSONSchema, StringboolYAML, StringboolXML } from "../../commonObjects/boolean/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import type { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"

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

registerTypeRule("MobileApplicationURLs", "importFromXML", importMobileApplicationURLsFromXML)
registerTypeRule("MobileApplicationURLs", "exportToXML", exportMobileApplicationURLsToXML)
registerTypeRule("MobileApplicationURLs", "importFromYAML", importMobileApplicationURLsFromYAML)
registerTypeRule("MobileApplicationURLs", "exportToYAML", exportMobileApplicationURLsToYAML)
registerTypeRule("MobileApplicationURLs", "exportToJSONSchema", exportMobileApplicationURLsToJSONSchema)
