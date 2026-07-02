import { Type } from "@sinclair/typebox"
import { getParentFromContext } from "~/metadata/context/helpers"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "~/metadata/context/types"
import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/fromXML"
import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  AccumulationRegisterAggregateDimensionXML,
  AccumulationRegisterAggregateDimensions,
  AccumulationRegisterAggregateDimensionsXML,
  AccumulationRegisterAggregateDimensionsYAML,
} from "./types"

import "./types"

const importAggregateDimensionsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: AccumulationRegisterAggregateDimensionsXML | undefined
): AccumulationRegisterAggregateDimensions | undefined => {
  const dimensions = xml?.Dimension
  if (dimensions === undefined) return undefined

  const result: AccumulationRegisterAggregateDimensions = {}
  const dimensionItems = Array.isArray(dimensions) ? dimensions : [dimensions]

  for (const item of dimensionItems) {
    const name = getDimensionNameFromRef(item._ref)
    if (name === undefined) continue
    const value = importBooleanFromXML(context, _rule, item["#text"])
    if (value !== undefined) result[name] = value
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const exportAggregateDimensionsToXML = (params: {
  context: ConfigurationContextWithExportToXML
  value: AccumulationRegisterAggregateDimensions | undefined
  referenceMetadata?: AccumulationRegisterAggregateDimensions
}): AccumulationRegisterAggregateDimensionsXML | undefined => {
  const dimensions = params.value ?? params.referenceMetadata
  if (dimensions === undefined) return undefined

  const registerName = getCurrentAccumulationRegisterName(params.context)
  const dimensionItems = Object.entries(dimensions).map<AccumulationRegisterAggregateDimensionXML>(([name, value]) => ({
    _ref: `AccumulationRegister.${registerName}.Dimension.${name}`,
    "#text": value,
  }))

  return dimensionItems.length > 0 ? { Dimension: dimensionItems } : undefined
}

const importAggregateDimensionsFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: AccumulationRegisterAggregateDimensionsYAML | undefined
): AccumulationRegisterAggregateDimensions | undefined => {
  if (value === undefined) return undefined

  const result: AccumulationRegisterAggregateDimensions = {}
  for (const [name, dimensionUse] of Object.entries(value)) {
    const importedValue = importBooleanFromYAML(context, rule, dimensionUse)
    if (importedValue !== undefined) result[name] = importedValue
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const exportAggregateDimensionsToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: AccumulationRegisterAggregateDimensions | undefined
): AccumulationRegisterAggregateDimensionsYAML | undefined => {
  if (value === undefined) return undefined

  const result: AccumulationRegisterAggregateDimensionsYAML = {}
  for (const [name, dimensionUse] of Object.entries(value)) {
    const exportedValue = exportBooleanToYAML(context, rule, dimensionUse)
    if (exportedValue !== undefined) result[name] = exportedValue
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const getDimensionNameFromRef = (ref: string | undefined): string | undefined => {
  if (ref === undefined) return undefined
  const marker = ".Dimension."
  const markerIndex = ref.lastIndexOf(marker)
  if (markerIndex >= 0) return ref.slice(markerIndex + marker.length)
  const parts = ref.split(".")
  return parts[parts.length - 1]
}

const getCurrentAccumulationRegisterName = (context: ConfigurationContextWithExportToXML): string => {
  const parentName = context.exportToXML.context?.parentName
  if (parentName) return parentName

  return getParentFromContext(context).name
}

registerTypeRule("AccumulationRegisterAggregateDimensions", "importFromXML", importAggregateDimensionsFromXML)
registerTypeRule("AccumulationRegisterAggregateDimensions", "exportToXML", exportAggregateDimensionsToXML)
registerTypeRule("AccumulationRegisterAggregateDimensions", "importFromYAML", importAggregateDimensionsFromYAML)
registerTypeRule("AccumulationRegisterAggregateDimensions", "exportToYAML", exportAggregateDimensionsToYAML)
registerTypeRule("AccumulationRegisterAggregateDimensions", "exportToJSONSchema", () =>
  Type.Record(Type.String(), Type.Union([Type.Literal("Истина"), Type.Literal("Ложь")]))
)
