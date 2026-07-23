import { Type } from "typebox"
import type { ConfigurationContextFromXML } from "../../../context/types"
import { registerMetadataItemRule, registerTypeRule } from "../../../orchestration"
import type { PropertyRule } from "../../../orchestration/property/types"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import "../../../commonObjects/dataCompositionSystem/index"
import { DynamicListRules } from "./rules"

/** Внутренняя модель по правилам; `Record<string, unknown>` — для pass-through полей до полного перевода импорта на rules. */
export type DynamicList = MetadataTypeByRule<typeof DynamicListRules> & Record<string, unknown>

export type DynamicListYAML = YAMLTypeByRule<typeof DynamicListRules> & Record<string, unknown>

export type DynamicListXML = {
  [key: string]: unknown
}

const importDynamicListKeyFieldsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  value: unknown
): string | string[] | undefined => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    const items = value.map(normalizeKeyField).filter((item): item is string => item !== undefined)
    return items.length > 0 ? items : undefined
  }
  return normalizeKeyField(value)
}

const normalizeKeyField = (value: unknown): string | undefined => {
  if (typeof value === "string" || typeof value === "number") return value.toString()
  if (value && typeof value === "object" && "#text" in value) {
    const text = (value as { "#text"?: unknown })["#text"]
    return text === undefined ? undefined : String(text)
  }
  return undefined
}

registerTypeRule("DynamicListKeyFields", "importFromXML", importDynamicListKeyFieldsFromXML)
registerTypeRule("DynamicListKeyFields", "exportToJSONSchema", () =>
  Type.Union([Type.String(), Type.Array(Type.String())])
)

registerMetadataItemRule({
  propertyType: "DynamicList",
  itemRule: DynamicListRules,
})
