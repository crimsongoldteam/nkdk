import { FormElementType, ItemOperationType, OperationFunction } from "./types"

const operationRegistries = new Map<ItemOperationType, Map<FormElementType, OperationFunction<ItemOperationType>>>()

export function registerMetadata<T extends ItemOperationType>(
  operationType: T,
  elementType: FormElementType,
  operationFunction: OperationFunction<T>
): void {
  let registry = operationRegistries.get(operationType)
  if (!registry) {
    registry = new Map()
    operationRegistries.set(operationType, registry)
  }
  registry.set(elementType, operationFunction)
}

export const getOperationRegistry = <T extends ItemOperationType>(operationType: T): OperationFunction<T> => {
  const registry = operationRegistries.get(operationType)
  if (!registry) throw new Error(`Unknown operation type: ${operationType}`)
  return {} as OperationFunction<T>
}

export const getOperationFunction = <T extends ItemOperationType>(
  operationType: T,
  key: FormElementType
): OperationFunction<T> => {
  const registry = operationRegistries.get(operationType)
  if (!registry) throw new Error(`Unknown operation type: ${operationType}`)

  const operationFunction = registry.get(key)
  if (!operationFunction) {
    throw new Error(`Operation function not found for type: ${operationType}, key: ${key}`)
  }

  return operationFunction
}

export const clearMetadataRegistry = (operationType: ItemOperationType): void => {
  const registry = operationRegistries.get(operationType)
  if (registry) {
    operationRegistries.delete(operationType)
  }
}

export const clearAllMetadataRegistries = (): void => {
  Object.keys(operationRegistries).forEach((key) => {
    operationRegistries.delete(key as ItemOperationType)
  })
}
