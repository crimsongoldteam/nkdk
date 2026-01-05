import { Context } from "../context/types"
import { MetadataType } from "./types"

export type ItemOperationType = "ExportToXML" | "ExportToEnterprise" | "ImportFromXML" | "ImportFromEnterprise"

type OperationFunction<T = any> = (context: Context, data: T, name: string) => any

type OperationRegistry = Map<MetadataType, OperationFunction>

const operationRegistries: Map<ItemOperationType, OperationRegistry> = new Map([
  ["ExportToXML", new Map()],
  ["ExportToEnterprise", new Map()],
  ["ImportFromXML", new Map()],
  ["ImportFromEnterprise", new Map()],
])

export const registerMetadata = <T = any>(
  operationType: ItemOperationType,
  key: MetadataType,
  operationFunction: OperationFunction<T>
): void => {
  const registry = operationRegistries.get(operationType)
  if (!registry) {
    throw new Error(`Unknown operation type: ${operationType}`)
  }

  registry.set(key, operationFunction as OperationFunction)
}

export const getOperationFunction = (
  operationType: ItemOperationType,
  key: MetadataType
): OperationFunction | undefined => {
  const registry = operationRegistries.get(operationType)
  if (!registry) {
    throw new Error(`Unknown operation type: ${operationType}`)
  }

  return registry.get(key)
}

export const executeOperation = <T = any>(
  operationType: ItemOperationType,
  key: MetadataType,
  data: T,
  context: Context,
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
