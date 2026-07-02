import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { OrderItemFieldRules } from "./rules"
import type { OrderItemFields } from "./types"

const findReferenceOrderItem = (
  item: OrderItemFields[number],
  referenceItems: OrderItemFields | undefined,
  index: number
): OrderItemFields[number] | undefined => {
  const referenceItem = referenceItems?.[index]
  return referenceItem?.itemType === item.itemType ? referenceItem : undefined
}

const exportOrderItemToXML = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: OrderItemFields[number]
  referenceData?: OrderItemFields[number]
}) => {
  const { context, value, referenceData } = params

  if (value.itemType === "OrderItemAuto") return { "_xsi:type": "dcsset:OrderItemAuto" }

  return {
    "_xsi:type": "dcsset:OrderItemField",
    ...exportMetadataItemToXML({
      context,
      data: value,
      rule: OrderItemFieldRules,
      referenceData: referenceData?.itemType === "OrderItemField" ? referenceData : undefined,
    }),
  }
}

export const exportOrderItemFieldsToXML: ExportToXMLFunctionNew = ({
  context,
  rule,
  value,
  referenceMetadata,
}: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: OrderItemFields | undefined
  referenceMetadata?: OrderItemFields
}) => {
  const inputData =
    value != null && value.length > 0
      ? value
      : referenceMetadata != null && referenceMetadata.length > 0
        ? referenceMetadata
        : []
  if (inputData.length === 0) return undefined

  return inputData.map((item, index) =>
    exportOrderItemToXML({
      context,
      rule,
      value: item,
      referenceData: findReferenceOrderItem(item, referenceMetadata, index),
    })
  )
}
