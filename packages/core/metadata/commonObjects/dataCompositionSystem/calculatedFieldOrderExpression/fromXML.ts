import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { ImportFromXMLFunction } from "~/metadata/orchestration/property/fn"
import { importMetadataItemFromXML } from "~/metadata/orchestration/metadataItem/fromXML"
import { CalculatedFieldOrderExpressionRules } from "./rules"

export const importCalculatedFieldOrderExpressionFromXML: ImportFromXMLFunction = (
  context: ConfigurationContextFromXML,
  _rule,
  xml: unknown
): unknown => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  const imported = items.flatMap((item) => {
    const result = importMetadataItemFromXML({ context, xml: item, rule: CalculatedFieldOrderExpressionRules })
    return result ? [result] : []
  })

  return imported.length > 0 ? imported : undefined
}
