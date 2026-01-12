import { ConfigurationContext } from "../context/types"
import { BaseElement, BaseElementPropsEnterprise } from "../forms/elements/baseElement/types"
import { ImportExportReturn, ImportFromEnterpriseReturn } from "../forms/elements/types"
import { MetadataType } from "./types"

export type ItemOperationType =
  | "ExportToXML"
  | "ExportPartialToEnterprise"
  | "ExportTypedToEnterprise"
  | "ImportFromXML"
  | "ImportFromEnterprise"
  | "ExportToStructure"
  | "ExportToStructureContent"

type OperationFunction<F extends object | undefined, T extends object | undefined = undefined> = (
  context: ConfigurationContext,
  data: F
) => ImportExportReturn<F, T>

type OperationImportFromEnterpriseFunction<
  T extends BaseElementPropsEnterprise | undefined,
  R extends BaseElement | undefined,
  N extends string | undefined,
> = (context: ConfigurationContext, data: T, name: N) => ImportFromEnterpriseReturn<T, R, N>

type OperationRegistry = Map<
  MetadataType,
  OperationFunction<any, any> | OperationImportFromEnterpriseFunction<any, any, any>
>

const operationRegistries: Map<ItemOperationType, OperationRegistry> = new Map([
  ["ExportToXML", new Map()],
  ["ExportPartialToEnterprise", new Map()],
  ["ExportTypedToEnterprise", new Map()],
  ["ImportFromXML", new Map()],
  ["ImportFromEnterprise", new Map()],
  ["ExportToStructureContent", new Map()],
  ["ExportToStructure", new Map()],
])

export function registerMetadata<T = any>(
  operationType: "ImportFromEnterprise",
  key: MetadataType,
  operationFunction: OperationImportFromEnterpriseFunction<any, any, any>
): void
export function registerMetadata<T = any>(
  operationType: Exclude<ItemOperationType, "ImportFromEnterprise">,
  key: MetadataType,
  operationFunction: OperationFunction<any, any>
): void
export function registerMetadata<F extends object | undefined, T extends object | undefined = undefined>(
  operationType: ItemOperationType,
  key: MetadataType,
  operationFunction:
    | OperationFunction<F, T>
    | OperationImportFromEnterpriseFunction<F, T extends BaseElement | undefined ? T : BaseElement, string | undefined>
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
  ? OperationImportFromEnterpriseFunction<any, any, any> | undefined
  : OperationFunction<any, any> | undefined => {
  const registry = operationRegistries.get(operationType)
  if (!registry) {
    throw new Error(`Unknown operation type: ${operationType}`)
  }

  return registry.get(key) as T extends "ImportFromEnterprise"
    ? OperationImportFromEnterpriseFunction<any, any, any> | undefined
    : OperationFunction<any, any> | undefined
}

export function executeOperation<
  F extends BaseElementPropsEnterprise | undefined,
  T extends BaseElement | undefined,
  N extends string | undefined,
>(
  operationType: "ImportFromEnterprise",
  key: MetadataType,
  context: ConfigurationContext,
  data: F,
  name: N
): ImportFromEnterpriseReturn<F, T, N>
export function executeOperation<F extends object | undefined, T extends object | undefined>(
  operationType: Exclude<ItemOperationType, "ImportFromEnterprise">,
  key: MetadataType,
  context: ConfigurationContext,
  data: F
): ImportExportReturn<F, T>
export function executeOperation<
  F extends object | undefined,
  T extends object | undefined,
  N extends string | undefined,
>(operationType: ItemOperationType, key: MetadataType, context: ConfigurationContext, data: F, name?: N): any {
  const operationFunction = getOperationFunction(operationType, key)

  if (!operationFunction) {
    throw new Error(`Operation function for type ${operationType} and key ${key} not found`)
  }

  if (operationType === "ImportFromEnterprise") {
    return (
      operationFunction as OperationImportFromEnterpriseFunction<F, T extends BaseElement | undefined ? T : any, N>
    )(context, data, name!) as ImportFromEnterpriseReturn<F, T extends BaseElement | undefined ? T : any, N>
  }

  return (operationFunction as OperationFunction<F, T>)(context, data) as ImportExportReturn<F, T>
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
