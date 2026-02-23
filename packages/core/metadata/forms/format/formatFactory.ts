import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { AllChildItems, OtherElement } from "../commonObjects/childItems/types"
import { exportOtherElementToNKDK } from "../elements/baseElement/exportToStructure"
import { NamedElement } from "../elements/baseElement/types"
import { CheckFormatFunction, FormatElementFunction } from "./types"

type FormatRegistry = {
  format: FormatElementFunction
  check: CheckFormatFunction<NamedElement>
}[]

const registry: FormatRegistry = []

export const registerFormat = <T extends NamedElement>(
  format: FormatElementFunction,
  check: CheckFormatFunction<T>
): void => {
  registry.push({
    format: format,
    check: check as CheckFormatFunction<NamedElement>,
  })
}

export const formatElement = <T extends NamedElement>(context: ConfigurationContext, element: T): ToNKDKResult => {
  const formatter = registry.find((f) => f.check(element)) as FormatRegistry[number]
  if (!formatter) return exportOtherElementToNKDK(context, element as OtherElement)

  const result = formatter.format(context, element)
  return result
}

export const formatElements = (context: ConfigurationContext, items: AllChildItems): ToNKDKResult => {
  let result: ToNKDKResult = {
    strings: [],
    toOneLineGroup: false,
  }

  const separatedItems: readonly (
    | typeof CollectionFormElementType.Pages
    | typeof CollectionFormElementType.UsualGroup
  )[] = [CollectionFormElementType.Pages, CollectionFormElementType.UsualGroup]

  let prevItem: NamedElement | null = null
  for (const item of items) {
    if (
      prevItem &&
      (separatedItems.includes(
        item.itemType as typeof CollectionFormElementType.Pages | typeof CollectionFormElementType.UsualGroup
      ) ||
        separatedItems.includes(
          prevItem.itemType as typeof CollectionFormElementType.Pages | typeof CollectionFormElementType.UsualGroup
        ))
    ) {
      result.strings.push("")
    }

    prevItem = item

    const text = formatElement(context, item)
    result.strings.push(...text.strings)
    result.toOneLineGroup = result.toOneLineGroup || text.toOneLineGroup
  }
  return result
}

export const clearFormatRegistry = (): void => {
  registry.length = 0
}
