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
    const referenceData = omitNonAscReferenceOrderType(item, referenceItem)
    const result = exportMetadataItemToXML({
      context,
      data,
      rule: CalculatedFieldOrderExpressionRules,
      referenceData,
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

const omitNonAscReferenceOrderType = (
  value: CalculatedFieldOrderExpressionItem,
  referenceMetadata: CalculatedFieldOrderExpressionItem | undefined
): CalculatedFieldOrderExpressionItem | undefined => {
  if (value.orderType !== undefined || referenceMetadata?.orderType === "Asc") return referenceMetadata
  if (referenceMetadata === undefined) return undefined

  const referenceWithoutOrderType = { ...referenceMetadata }
  delete referenceWithoutOrderType.orderType
  return referenceWithoutOrderType
}
