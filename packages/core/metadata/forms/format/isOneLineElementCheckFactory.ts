import { CollectableElement, CollectableElementType } from "~/metadata/orchestration"
import { NamedElement } from "../elements/baseElement/types"
import { CheckIsOneLineElementFunction } from "./types"

const isOneLineElementCheckRegistry: Map<
  CollectableElementType,
  CheckIsOneLineElementFunction<NamedElement>
> = new Map()

export const registerIsOneLineElementCheck = <T extends NamedElement>(
  type: CollectableElementType,
  check: CheckIsOneLineElementFunction<T>
): void => {
  isOneLineElementCheckRegistry.set(type, check as CheckIsOneLineElementFunction<NamedElement>)
}

export const isOneLineElement = <T extends CollectableElement>(element: T): boolean => {
  const checkFunction = isOneLineElementCheckRegistry.get(element.itemType)

  if (!checkFunction) return false

  return checkFunction(element)
}

export const clearIsOneLineElementCheckRegistry = (): void => {
  isOneLineElementCheckRegistry.clear()
}
