import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { CalculatedFieldOrderExpressionItem } from "./types"
import { CalculatedFieldOrderExpressionRules } from "./rules"

export const exportCalculatedFieldOrderExpressionToXML: ExportToXMLFunctionNew = (params: {
  context: ConfigurationContextWithExportToXML
  value: CalculatedFieldOrderExpression | undefined
}) => {
  const { context, value } = params
  if (!value || value.length === 0) return undefined

  const exported = (value as CalculatedFieldOrderExpressionItem[]).flatMap((item) => {
    const result = exportMetadataItemToXML({ context, data: item, rule: CalculatedFieldOrderExpressionRules })
    return result ? [result] : []
  })

  return exported.length > 0 ? exported : undefined
}

type CalculatedFieldOrderExpression = CalculatedFieldOrderExpressionItem[]
