import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { CalculatedFieldOrderExpressionItem } from "./types"
import { CalculatedFieldOrderExpressionRules } from "./rules"

export const exportCalculatedFieldOrderExpressionToXML: ExportToXMLFunctionNew = (params: {
  context: ConfigurationContextWithExportToXML
  value: CalculatedFieldOrderExpression | undefined
  referenceMetadata?: CalculatedFieldOrderExpression | undefined
}) => {
  const { context, value, referenceMetadata } = params
  if (!value || value.length === 0) return undefined

  const exported = (value as CalculatedFieldOrderExpressionItem[]).flatMap((item) => {
    const referenceItem = referenceMetadata?.find((reference) => reference.expression === item.expression)
    const data = restoreExplicitReferenceAsc(item, referenceItem)
    const result = exportMetadataItemToXML({
      context,
      data,
      rule: CalculatedFieldOrderExpressionRules,
      referenceData: referenceItem,
    })
    return result ? [result] : []
  })

  return exported.length > 0 ? exported : undefined
}

type CalculatedFieldOrderExpression = CalculatedFieldOrderExpressionItem[]

const restoreExplicitReferenceAsc = (
  value: CalculatedFieldOrderExpressionItem,
  referenceMetadata: CalculatedFieldOrderExpressionItem | undefined
): CalculatedFieldOrderExpressionItem => {
  if (
    value.orderType === undefined &&
    referenceMetadata?.orderType === "Asc" &&
    value.expression === referenceMetadata.expression
  ) {
    return { ...value, orderType: "Asc" }
  }

  return value
}
