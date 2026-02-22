import { FormElementType } from "../metadataType/types"
import { ItemOperationType, OperationFunction } from "./types"

const operationRegistries = new Map<ItemOperationType, Map<FormElementType, OperationFunction<ItemOperationType>>>()

export function registerElementOperation<T extends "ExportToStructure" | "ExportToStructureContent" | "ImportFromNKDK">(
  operationType: T,
  itemType: FormElementType,
  operationFunction: OperationFunction<T>
): void {
  let registry = operationRegistries.get(operationType)
  if (!registry) {
    registry = new Map()
    operationRegistries.set(operationType, registry)
  }
  registry.set(itemType, operationFunction)
}

export const getElementOperationFunction = <T extends ItemOperationType>(
  operationType: T,
  key: FormElementType
): OperationFunction<T> | undefined => {
  const registry = operationRegistries.get(operationType)
  if (!registry) throw new Error(`Unknown operation type: ${operationType}`)

  const operationFunction = registry.get(key)
  if (!operationFunction) {
    return undefined
  }

  return operationFunction
}

export const clearAllMetadataRegistries = (): void => {
  Object.keys(operationRegistries).forEach((key) => {
    operationRegistries.delete(key as ItemOperationType)
  })
}
