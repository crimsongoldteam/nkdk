import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromXML, registerMetadataItemRule, registerTypeRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DynamicListRules } from "./rules"

/** Внутренняя модель по правилам; `Record<string, unknown>` — для pass-through полей до полного перевода импорта на rules. */
export type DynamicList = MetadataTypeByRule<typeof DynamicListRules> & Record<string, unknown>

export type DynamicListYAML = YAMLTypeByRule<typeof DynamicListRules> & Record<string, unknown>

export type DynamicListXML = {
  [key: string]: unknown
}

registerMetadataItemRule({
  propertyType: "DynamicList",
  itemRule: DynamicListRules,
})

// Переопределяем importFromXML:
// 1. Проверяем, что XML является DynamicList (xsi:type="DynamicList")
// 2. Если ManualQuery=false, очищаем queryText (не допускаем запись мусорного .bsl)
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
      "QueryText" in xmlObj
    if (!isDynamicListXml) return undefined

    const result = importMetadataItemFromXML({ context, xml, rule: DynamicListRules }) as DynamicList | undefined
    if (!result) return undefined

    // ManualQuery=false → queryText не попадает в модель (предотвращаем мусорный .bsl)
    if (!result.customQuery && result.queryText !== undefined) {
      const { queryText: _qt, ...rest } = result as Record<string, unknown>
      return { ...rest, itemType: DynamicListRules.itemType } as DynamicList
    }

    return result
  }
)
