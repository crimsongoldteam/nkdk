import type { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../property/types"
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

let enterpriseDataPathExporter: EnterpriseDataPathExporter | undefined
const collectionElementTypes = new Map<string, readonly CollectableElementType[]>()

export function registerFormElementAdapter<Type extends CollectableElementType>(params: {
  type: Type
  yamlName: FormElementTypeMap[Type] & string
}): void {
  CollectableElementTypeToYAML[params.type] = params.yamlName
  CollectableElementTypeFromYAML[params.yamlName] = params.type
}

export function registerFormElementDataPathExporter(exporter: EnterpriseDataPathExporter): void {
  enterpriseDataPathExporter = exporter
}

export function exportFormElementDataPath(params: Parameters<EnterpriseDataPathExporter>[0]): string | undefined {
  return enterpriseDataPathExporter?.(params)
}

export function registerFormElementCollection(
  propertyType: string,
  elementTypes: readonly CollectableElementType[]
): void {
  collectionElementTypes.set(propertyType, elementTypes)
}

export function getFormElementCollectionTypes(propertyType: string): readonly CollectableElementType[] | undefined {
  return collectionElementTypes.get(propertyType)
}

export function getFormElementCollectionPropertyTypes(): readonly string[] {
  return [...collectionElementTypes.keys()]
}
