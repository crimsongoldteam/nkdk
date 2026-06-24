import { exportMetadataItemToXML } from "~/metadata/orchestration"
import type { MetadataItemRule } from "~/metadata/orchestration"
import type { NamedElementXML } from "~/metadata/orchestration/metadataCollection/types"
import type { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"
import type { ItemXML } from "~/metadata/orchestration/property/types"
import { resolveSystemEnumerationXsiType } from "~/metadata/systemEnumerations/toDcsXML"
import * as SystemEnumerations from "~/metadata/systemEnumerations/types"
import type { SystemEnumerationTypeMap } from "~/metadata/systemEnumerations/types"

import { DCSParameterRules } from "./rules"
import type { DCSParameter, DCSParameters } from "./types"

type ReferenceUndefinedTypeValueXML = Record<string, unknown> & {
  "#text": string
  "_xsi:type": "v8:Type"
}

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object"

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

const findReferenceItem = (item: DCSParameter, referenceData: DCSParameters | undefined): DCSParameter | undefined =>
  referenceData?.find((referenceItem) => referenceItem.name === item.name)

const omitValue = (item: DCSParameter): DCSParameter => {
  const { value: _value, ...itemWithoutValue } = item
  return itemWithoutValue
}

const getSingleValueTypeName = (item: DCSParameter): string | undefined => {
  const valueType = item.valueType
  if (!isObject(valueType)) return undefined

  const type = valueType.type
  if (!Array.isArray(type) || type.length !== 1) return undefined

  return typeof type[0] === "string" ? type[0] : undefined
}

const inferEntSystemEnumerationType = (item: DCSParameter): keyof SystemEnumerationTypeMap | undefined => {
  const typeName = getSingleValueTypeName(item)
  if (typeName === undefined) return undefined

  const yamlMapName = `${typeName}ToYAML`
  if (!Object.prototype.hasOwnProperty.call(SystemEnumerations, yamlMapName)) return undefined

  const typeSE = typeName as keyof SystemEnumerationTypeMap
  return resolveSystemEnumerationXsiType(typeSE).startsWith("ent:") ? typeSE : undefined
}

const normalizeValueByValueType = (item: DCSParameter): DCSParameter => {
  if (item.value === undefined || item.value === null) return item

  const typeName = getSingleValueTypeName(item)
  if (typeName === "UUID") {
    if (typeof item.value === "string") {
      return { ...item, value: { type: "uuid", value: item.value } }
    }
    if (
      typeof item.value === "object" &&
      !Array.isArray(item.value) &&
      "type" in item.value &&
      item.value.type === "string" &&
      typeof item.value.value === "string"
    ) {
      return { ...item, value: { type: "uuid", value: item.value.value } }
    }
  }

  return item
}

const ruleForItem = (item: DCSParameter): MetadataItemRule => {
  const typeSE = inferEntSystemEnumerationType(item)
  if (typeSE === undefined) return DCSParameterRules

  return {
    ...DCSParameterRules,
    properties: {
      ...DCSParameterRules.properties,
      value: {
        ...DCSParameterRules.properties.value,
        valueType: "SystemEnumeration",
        typeSE,
      },
    },
  } satisfies MetadataItemRule
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

  const result = inputData.map((rawItem) => {
    const item = normalizeValueByValueType(rawItem)
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
        rule: ruleForItem(item),
      }) as NamedElementXML | undefined) ?? {}

    if (referenceUndefinedValue !== undefined) {
      itemXML["dcssch:value"] = referenceUndefinedValue
    }

    return itemXML
  })

  return params.rule.xml === "Parameter" ? result : { Parameter: result }
}
