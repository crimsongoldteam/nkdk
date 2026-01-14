import { FormElementType } from "~/metadata/metadataFactory/types"
import { NamedElement } from "../elements/baseElement/types"
import { CheckIsOneLineElementFunction } from "./types"

const isOneLineElementCheckRegistry: Map<FormElementType, CheckIsOneLineElementFunction<NamedElement>> = new Map()

export const registerIsOneLineElementCheck = <T extends NamedElement>(
  type: FormElementType,
  check: CheckIsOneLineElementFunction<T>
): void => {
  isOneLineElementCheckRegistry.set(type, check as CheckIsOneLineElementFunction<NamedElement>)
}

export const isOneLineElement = <T extends NamedElement>(element: T): boolean => {
  const checkFunction = isOneLineElementCheckRegistry.get(element.elementType)

  if (!checkFunction) return false

  return checkFunction(element)
}

export const clearIsOneLineElementCheckRegistry = (): void => {
  isOneLineElementCheckRegistry.clear()
}
