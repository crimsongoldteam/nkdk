import { ConfigurationContext } from "../context/types"
import { MetadataType } from "./types"

export type ItemOperationType = "ExportToXML" | "ExportToEnterprise" | "ImportFromXML" | "ImportFromEnterprise" | "ExportToStructure"

type OperationFunction<T = any> = (context: ConfigurationContext, data: T) => any
type OperationImportFromEnterpriseFunction<T = any> = (
  context: ConfigurationContext,
  data: T | undefined,
  name: string
) => any

type OperationRegistry = Map<MetadataType, OperationFunction | OperationImportFromEnterpriseFunction>

const operationRegistries: Map<ItemOperationType, OperationRegistry> = new Map([
  ["ExportToXML", new Map()],
  ["ExportToEnterprise", new Map()],
  ["ImportFromXML", new Map()],
  ["ImportFromEnterprise", new Map()],
  ["ExportToStructure", new Map()],
])

export function registerMetadata<T = any>(
  operationType: "ImportFromEnterprise",
  key: MetadataType,
  operationFunction: OperationImportFromEnterpriseFunction<T>
): void
export function registerMetadata<T = any>(
  operationType: Exclude<ItemOperationType, "ImportFromEnterprise">,
  key: MetadataType,
  operationFunction: OperationFunction<T>
): void
export function registerMetadata<T = any>(
  operationType: ItemOperationType,
  key: MetadataType,
  operationFunction: OperationFunction<T> | OperationImportFromEnterpriseFunction<T>
): void {
  const registry = operationRegistries.get(operationType)
  if (!registry) {
    throw new Error(`Unknown operation type: ${operationType}`)
  }

  registry.set(key, operationFunction)
}

export const getOperationFunction = <T extends ItemOperationType>(
  operationType: T,
  key: MetadataType
): T extends "ImportFromEnterprise"
  ? OperationImportFromEnterpriseFunction | undefined
  : OperationFunction | undefined => {
  const registry = operationRegistries.get(operationType)
  if (!registry) {
    throw new Error(`Unknown operation type: ${operationType}`)
  }

  return registry.get(key) as T extends "ImportFromEnterprise"
    ? OperationImportFromEnterpriseFunction | undefined
    : OperationFunction | undefined
}

export const executeOperation = <T = any>(
  operationType: ItemOperationType,
  key: MetadataType,
  data: T,
  context: ConfigurationContext,
  name: string
): any => {
  const operationFunction = getOperationFunction(operationType, key)

  if (!operationFunction) {
    throw new Error(`Operation function for type ${operationType} and key ${key} not found`)
  }

  return operationFunction(context, data, name)
}

export const clearMetadataRegistry = (operationType: ItemOperationType): void => {
  const registry = operationRegistries.get(operationType)
  if (registry) {
    registry.clear()
  }
}

export const clearAllMetadataRegistries = (): void => {
  operationRegistries.forEach((registry) => registry.clear())
}
