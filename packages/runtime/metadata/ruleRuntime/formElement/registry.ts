import type { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../property/types"
import { getTypeRule } from "../property/typeRuleRegistry"
import {
  CollectableElementTypeFromYAML,
  CollectableElementTypeToYAML,
  type CollectableElementType,
  type FormElementTypeMap,
} from "./types"

type EnterpriseDataPathExporter = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: string
}) => string | undefined

export function registerFormElementAdapter<Type extends CollectableElementType>(params: {
  type: Type
  yamlName: FormElementTypeMap[Type] & string
}): void {
  CollectableElementTypeToYAML[params.type] = params.yamlName
  CollectableElementTypeFromYAML[params.yamlName] = params.type
}

export function exportFormElementDataPath(params: Parameters<EnterpriseDataPathExporter>[0]): string | undefined {
  const exporter = getTypeRule("DataPath", "exportToEnterprise")
  return exporter?.(params) as string | undefined
}
