import { exportMetadataItemToXML } from "~/metadata/orchestration"
import type { NamedElementXML } from "~/metadata/orchestration/metadataCollection/types"
import type { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"
import type { ItemXML } from "~/metadata/orchestration/property/types"

import { DCSParameterRules } from "./rules"
import type { DCSParameter, DCSParameters } from "./types"

type ReferenceUndefinedTypeValueXML = Record<string, unknown> & {
  "#text": string
  "_xsi:type": "v8:Type"
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object"

const isReferenceTypeValue = (value: unknown): value is Record<string, unknown> =>
  isObject(value) && value["_xsi:type"] === "v8:Type"

const getReferenceUndefinedTypeValue = (value: unknown): ReferenceUndefinedTypeValueXML | undefined => {
  if (!isReferenceTypeValue(value)) {
    return undefined
  }

  const text = value["#text"]
  if (typeof text !== "string") {
    return undefined
  }

  const parts = text.split(":")
  if (parts.length !== 2) {
    return undefined
  }

  const [prefix, name] = parts
  if (prefix === "" || name !== "Undefined") {
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

const omitValue = (item: DCSParameter): DCSParameter => {
  const { value: _value, ...itemWithoutValue } = item
  return itemWithoutValue
}

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

  const result = inputData.map((item) => {
    const referenceItem = findReferenceItem(item, referenceData)
    const referenceUndefinedValue = hasMissingValue(item)
      ? getReferenceUndefinedTypeValue(referenceItem?.value)
      : undefined
    const hasInvalidReferenceTypeValue =
      hasMissingValue(item) &&
      referenceItem !== undefined &&
      isReferenceTypeValue(referenceItem.value) &&
      referenceUndefinedValue === undefined
    const referenceForExport =
      referenceUndefinedValue !== undefined && referenceItem !== undefined
        ? { ...referenceItem, value: undefined }
        : hasInvalidReferenceTypeValue
          ? omitValue(referenceItem)
        : referenceItem

    const itemXML: ItemXML =
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
