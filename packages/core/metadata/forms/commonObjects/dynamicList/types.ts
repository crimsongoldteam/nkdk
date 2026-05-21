import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import {
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
  registerMetadataItemRule,
  registerTypeRule,
} from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import "~/metadata/commonObjects/dataCompositionSystem/index"
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

registerMetadataItemRule({
  propertyType: "DynamicList",
  itemRule: DynamicListRules,
})

registerTypeRule(
  "DynamicList",
  "importFromYAML",
  (params: { context: ConfigurationContext; value: DynamicListYAML | undefined; source?: unknown; name?: string }) => {
    const { context, value: yaml, source, name } = params
    if (yaml === undefined) return undefined

    const contextWithParent =
      name !== undefined && context.importFromYAML !== undefined
        ? {
            ...context,
            importFromYAML: {
              ...context.importFromYAML,
              parent: { name },
            },
          }
        : context

    return importMetadataItemFromYAML({
      context: contextWithParent,
      yaml,
      rule: DynamicListRules,
      source: normalizeDynamicListSource(contextWithParent, source),
      name,
    }) as DynamicList | undefined
  }
)

// Переопределяем importFromXML:
// 1. Проверяем, что XML является DynamicList (xsi:type="DynamicList")
// 2. Сохраняем QueryText даже при ManualQuery=false: такие XML встречаются в реальных формах.
registerTypeRule(
  "DynamicList",
  "importFromXML",
  (context: ConfigurationContextFromXML, _rule: PropertyRule, xml: unknown) => {
    if (!xml || typeof xml !== "object") return undefined

    const xmlObj = xml as Record<string, unknown>
    const xsiType = xmlObj["_xsi:type"]

    // Только настройки типа DynamicList; TypeDescription и другие — пропускаем
    if (xsiType !== undefined && xsiType !== "DynamicList") return undefined

    // Если нет ни одного специфичного поля DynamicList, считаем что это не DynamicList
    const isDynamicListXml =
      "ManualQuery" in xmlObj ||
      "DynamicDataRead" in xmlObj ||
      "MainTable" in xmlObj ||
      "QueryText" in xmlObj ||
      "KeyType" in xmlObj ||
      "KeyField" in xmlObj
    if (!isDynamicListXml) return undefined

    const result = importMetadataItemFromXML({ context, xml, rule: DynamicListRules }) as DynamicList | undefined
    if (!result) return undefined

    return result
  }
)

const normalizeDynamicListSource = (context: ConfigurationContext, source: unknown): DynamicList | undefined => {
  if (source === undefined || source === null || typeof source !== "object" || Array.isArray(source)) return undefined

  const sourceObject = source as Record<string, unknown>
  if (sourceObject.itemType === "DynamicList" || "calculatedFields" in sourceObject) return source as DynamicList
  if (sourceObject["_xsi:type"] !== undefined && sourceObject["_xsi:type"] !== "DynamicList") return undefined

  return importMetadataItemFromXML({
    context: {
      ...context,
      fromXML: { forReference: true },
    },
    xml: source,
    rule: DynamicListRules,
  }) as DynamicList | undefined
}
