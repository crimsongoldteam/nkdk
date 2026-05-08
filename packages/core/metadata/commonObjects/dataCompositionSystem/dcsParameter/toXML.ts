import { exportMetadataItemToXML } from "~/metadata/orchestration"
import type { NamedElementXML } from "~/metadata/orchestration/metadataCollection/types"
import type { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"

import { DCSParameterRules } from "./rules"
import type { DCSParameter, DCSParameters } from "./types"

type ReferenceUndefinedTypeValueXML = Record<string, unknown> & {
  "#text": string
  "_xsi:type": "v8:Type"
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object"

const getReferenceUndefinedTypeValue = (value: unknown): ReferenceUndefinedTypeValueXML | undefined => {
  if (!isObject(value) || value["_xsi:type"] !== "v8:Type") {
    return undefined
  }

  const text = value["#text"]
  if (typeof text !== "string") {
    return undefined
  }

  const [prefix, name] = text.split(":")
  if (!prefix || name !== "Undefined") {
    return undefined
  }

  const namespaceKey = `_xmlns:${prefix}`
  if (typeof value[namespaceKey] !== "string") {
    return undefined
  }

  return value as ReferenceUndefinedTypeValueXML
}

const hasMissingValue = (item: DCSParameter): boolean =>
  !Object.prototype.hasOwnProperty.call(item, "value") || item.value === undefined

const findReferenceItem = (
  item: DCSParameter,
  referenceData: DCSParameters | undefined,
): DCSParameter | undefined => referenceData?.find((referenceItem) => referenceItem.name === item.name)

export const exportDCSParametersToXML: ExportToXMLFunctionNew = (params) => {
  const data = params.value as DCSParameters | undefined
  const referenceData = params.referenceMetadata as DCSParameters | undefined
  const inputData =
    data !== undefined && data.length > 0
      ? data
      : referenceData !== undefined && referenceData.length > 0
        ? referenceData
        : []

  if (inputData.length === 0) {
    return undefined
  }

  const result = inputData.map((item, index) => {
    const referenceItem = findReferenceItem(item, referenceData) ?? referenceData?.[index]
    const referenceUndefinedValue = hasMissingValue(item)
      ? getReferenceUndefinedTypeValue(referenceItem?.value)
      : undefined
    const referenceForExport =
      referenceUndefinedValue !== undefined && referenceItem !== undefined
        ? { ...referenceItem, value: undefined }
        : referenceItem

    const itemXML =
      (exportMetadataItemToXML({
        context: params.context,
        data: item,
        referenceData: referenceForExport,
        rule: DCSParameterRules,
      }) as NamedElementXML | undefined) ?? {}

    if (referenceUndefinedValue !== undefined) {
      itemXML["dcssch:value"] = referenceUndefinedValue
    }

    return itemXML
  })

  return params.rule.xml === "Parameter" ? result : { Parameter: result }
}
