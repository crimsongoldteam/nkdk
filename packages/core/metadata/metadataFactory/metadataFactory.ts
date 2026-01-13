import { ConfigurationContext } from "../context/types"
import { BaseElement, BaseElementPropsEnterprise } from "../forms/elements/baseElement/types"
import { ImportExportReturn } from "../forms/elements/types"
import { MetadataType } from "./types"

export type ItemOperationType =
  | "ExportToXML"
  | "ExportPartialToEnterprise"
  | "ExportTypedToEnterprise"
  | "ImportFromXML"
  | "ImportPartialFromEnterprise"
  | "ImportTypedFromEnterprise"
  | "ExportToStructure"
  | "ExportToStructureContent"

type ImportExportFn<F extends object | undefined, T extends object | undefined = undefined> = (
  context: ConfigurationContext,
  data: F
) => ImportExportReturn<F, T>

type ImportPartialFromEnterpriseFn<
  From extends BaseElementPropsEnterprise | undefined,
  To extends BaseElement | undefined,
> = (context: ConfigurationContext, source: To | undefined, data: From) => ImportExportReturn<From, To>

type ImportTypedFromEnterpriseFn<
  From extends BaseElementPropsEnterprise | undefined,
  To extends BaseElement | undefined,
> = (context: ConfigurationContext, data: From, name: string) => ImportExportReturn<From, To>

type OperationFunction =
  | ImportExportFn<any, any>
  | ImportPartialFromEnterpriseFn<any, any>
  | ImportTypedFromEnterpriseFn<any, any>

type OperationRegistry = Map<MetadataType, OperationFunction>

const operationRegistries: Map<ItemOperationType, OperationRegistry> = new Map([
  ["ExportToXML", new Map()],
  ["ExportPartialToEnterprise", new Map()],
  ["ExportTypedToEnterprise", new Map()],
  ["ImportFromXML", new Map()],
  ["ImportPartialFromEnterprise", new Map()],
  ["ImportTypedFromEnterprise", new Map()],
  ["ExportToStructureContent", new Map()],
  ["ExportToStructure", new Map()],
])

export function registerMetadata(
  operationType: "ImportPartialFromEnterprise",
  key: MetadataType,
  operationFunction: ImportPartialFromEnterpriseFn<any, any>
): void
export function registerMetadata(
  operationType: Exclude<ItemOperationType, "ImportTypedFromEnterprise">,
  key: MetadataType,
  operationFunction: ImportTypedFromEnterpriseFn<any, any>
): void
export function registerMetadata(
  operationType: ItemOperationType,
  key: MetadataType,
  operationFunction: OperationFunction
): void {
  const registry = operationRegistries.get(operationType)
  if (!registry) throw new Error(`Unknown operation type: ${operationType}`)

  registry.set(key, operationFunction)
}

export const getOperationFunction = <T extends ItemOperationType>(
  operationType: T,
  key: MetadataType
): T extends "ImportPartialFromEnterprise"
  ? ImportPartialFromEnterpriseFn<any, any>
  : T extends "ImportTypedFromEnterprise"
    ? ImportTypedFromEnterpriseFn<any, any>
    : ImportExportFn<any, any> => {
  const registry = operationRegistries.get(operationType)
  if (!registry) throw new Error(`Unknown operation type: ${operationType}`)

  const operationFunction = registry.get(key)
  if (!operationFunction) {
    throw new Error(`Operation function not found for type: ${operationType}, key: ${key}`)
  }

  return operationFunction as T extends "ImportPartialFromEnterprise"
    ? ImportPartialFromEnterpriseFn<any, any>
    : T extends "ImportTypedFromEnterprise"
      ? ImportTypedFromEnterpriseFn<any, any>
      : ImportExportFn<any, any>
}

export const executeImportExportOperation = <F extends object | undefined, T extends object | undefined = undefined>(
  operationType: Exclude<ItemOperationType, "ImportPartialFromEnterprise" | "ImportTypedFromEnterprise">,
  key: MetadataType,
  context: ConfigurationContext,
  data: F
): ImportExportReturn<F, T> => {
  const operationFunction = getOperationFunction(operationType, key)

  return operationFunction(context, data)
}

export const executeImportPartialFromEnterpriseOperation = <
  F extends BaseElementPropsEnterprise | undefined,
  T extends BaseElement | undefined,
>(
  operationType: "ImportPartialFromEnterprise",
  key: MetadataType,
  context: ConfigurationContext,
  source: T | undefined,
  data: F
): ImportExportReturn<F, T> => {
  const operationFunction = getOperationFunction(operationType, key)

  return operationFunction(context, source, data)
}

export const executeImportTypedFromEnterpriseOperation = <
  F extends BaseElementPropsEnterprise | undefined,
  T extends BaseElement | undefined,
>(
  key: MetadataType,
  context: ConfigurationContext,
  data: F,
  name: string
): ImportExportReturn<F, T> => {
  const operationFunction = getOperationFunction("ImportTypedFromEnterprise", key)

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
