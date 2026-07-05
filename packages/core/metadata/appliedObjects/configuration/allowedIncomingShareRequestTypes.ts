import { Type } from "typebox"
import { importBooleanFromXML } from "../../commonObjects/boolean/fromXML"
import { importBooleanFromYAML } from "../../commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "../../commonObjects/boolean/toYAML"
import { BooleanJSONSchema, StringboolYAML, StringboolXML } from "../../commonObjects/boolean/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import type { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"

export interface AllowedIncomingShareRequestType {
  mime: string
  uti: string
  ext: string
  processingVariant: number
  isCustom: boolean
}

export type AllowedIncomingShareRequestTypes = AllowedIncomingShareRequestType[]

export interface AllowedIncomingShareRequestTypeYAML {
  mime: string
  uti: string
  ext: string
  processingVariant: number
  isCustom: StringboolYAML
}

export type AllowedIncomingShareRequestTypesYAML = AllowedIncomingShareRequestTypeYAML[]

type TextXML = string | { "#text"?: string }
type DecimalXML = number | string | { "#text"?: number | string; [key: string]: unknown }
type BooleanXML = StringboolXML | { "#text"?: StringboolXML; [key: string]: unknown }

interface AllowedIncomingShareRequestTypeXML {
  "_xsi:type": "app:AllowedIncomingShareRequestType"
  "app:mime": TextXML
  "app:uti": TextXML
  "app:ext": TextXML
  "app:processingVariant": DecimalXML
  "app:isCustom": BooleanXML
}

interface AllowedIncomingShareRequestTypesXML {
  "v8:Value"?: AllowedIncomingShareRequestTypeXML | AllowedIncomingShareRequestTypeXML[]
}

export const AllowedIncomingShareRequestTypesJSONSchema = Type.Array(
  Type.Object({
    mime: Type.String(),
    uti: Type.String(),
    ext: Type.String(),
    processingVariant: Type.Number(),
    isCustom: BooleanJSONSchema,
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

const decimal = (value: DecimalXML | undefined): number => {
  if (value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return Number(value["#text"] ?? 0)
}

export const importAllowedIncomingShareRequestTypesFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: AllowedIncomingShareRequestTypesXML | "" | undefined
): AllowedIncomingShareRequestTypes | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return []

  return normalizeArray(xml["v8:Value"]).map((item) => ({
    mime: text(item["app:mime"]),
    uti: text(item["app:uti"]),
    ext: text(item["app:ext"]),
    processingVariant: decimal(item["app:processingVariant"]),
    isCustom: importBooleanFromXML(context, undefined, item["app:isCustom"]) ?? false,
  }))
}

export const exportAllowedIncomingShareRequestTypesToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AllowedIncomingShareRequestTypes | undefined
): AllowedIncomingShareRequestTypesXML | "" | undefined => {
  if (data === undefined) return undefined
  if (data.length === 0) return ""

  return {
    "v8:Value": data.map((item) => ({
      "_xsi:type": "app:AllowedIncomingShareRequestType",
      "app:mime": item.mime,
      "app:uti": item.uti,
      "app:ext": item.ext,
      "app:processingVariant": { "_xsi:type": "xs:decimal", "#text": String(item.processingVariant) },
      "app:isCustom": item.isCustom,
    })),
  }
}

export const importAllowedIncomingShareRequestTypesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: AllowedIncomingShareRequestTypesYAML | undefined
): AllowedIncomingShareRequestTypes | undefined => {
  if (yaml === undefined) return undefined

  return yaml.map((item) => ({
    mime: item.mime,
    uti: item.uti,
    ext: item.ext,
    processingVariant: item.processingVariant,
    isCustom: importBooleanFromYAML(context, undefined, item.isCustom) ?? false,
  }))
}

export const exportAllowedIncomingShareRequestTypesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AllowedIncomingShareRequestTypes | undefined
): AllowedIncomingShareRequestTypesYAML | undefined => {
  if (data === undefined) return undefined

  return data.map((item) => ({
    mime: item.mime,
    uti: item.uti,
    ext: item.ext,
    processingVariant: item.processingVariant,
    isCustom: exportBooleanToYAML(context, undefined, item.isCustom) ?? "Ложь",
  }))
}

export const exportAllowedIncomingShareRequestTypesToJSONSchema: ExportToJSONSchemaFn = () =>
  AllowedIncomingShareRequestTypesJSONSchema

registerTypeRule("AllowedIncomingShareRequestTypes", "importFromXML", importAllowedIncomingShareRequestTypesFromXML)
registerTypeRule("AllowedIncomingShareRequestTypes", "exportToXML", exportAllowedIncomingShareRequestTypesToXML)
registerTypeRule("AllowedIncomingShareRequestTypes", "importFromYAML", importAllowedIncomingShareRequestTypesFromYAML)
registerTypeRule("AllowedIncomingShareRequestTypes", "exportToYAML", exportAllowedIncomingShareRequestTypesToYAML)
registerTypeRule(
  "AllowedIncomingShareRequestTypes",
  "exportToJSONSchema",
  exportAllowedIncomingShareRequestTypesToJSONSchema
)
