import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../elements/baseElement/types"
import { CheckIsOneLineElementFunction } from "./types"

const isOneLineElementCheckRegistry: Map<FormElementType, CheckIsOneLineElementFunction<BaseElement>> = new Map()

export const registerIsOneLineElementCheck = <T extends BaseElement>(
  type: FormElementType,
  check: CheckIsOneLineElementFunction<T>
): void => {
  isOneLineElementCheckRegistry.set(type, check as CheckIsOneLineElementFunction<BaseElement>)
}

export const isOneLineElement = <T extends BaseElement>(element: T): boolean => {
  const checkFunction = isOneLineElementCheckRegistry.get(element.elementType)

  if (!checkFunction) return false

  return checkFunction(element)
}

export const clearIsOneLineElementCheckRegistry = (): void => {
  isOneLineElementCheckRegistry.clear()
}
