import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ChildItems } from "../collections/childItems/types"
import { exportOtherElementToStructure } from "../elements/baseElement/exportToStructure"
import { BaseElement } from "../elements/baseElement/types"
import { CheckFormatFunction, FormatElementFunction, IFormatElementResult } from "./types"

type FormatRegistry = {
  format: FormatElementFunction
  check: CheckFormatFunction<BaseElement>
}[]

const registry: FormatRegistry = []

export const registerFormat = <T extends BaseElement>(
  format: FormatElementFunction,
  check: CheckFormatFunction<T>
): void => {
  registry.push({
    format: format,
    check: check as CheckFormatFunction<BaseElement>,
  })
}

export const formatElement = <T extends BaseElement>(
  context: ConfigurationContext,
  element: T
): IFormatElementResult => {
  const formatter = registry.find((f) => f.check(element)) as FormatRegistry[number]
  if (!formatter) return exportOtherElementToStructure(context, element)

  const result = formatter.format(context, element)
  return result
}

export const formatElements = (context: ConfigurationContext, items: ChildItems): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const separatedItems: readonly (typeof FormElementType.Pages | typeof FormElementType.UsualGroup)[] = [
    FormElementType.Pages,
    FormElementType.UsualGroup,
  ]

  let prevItem: BaseElement | null = null
  for (const item of items) {
    if (
      prevItem &&
      (separatedItems.includes(item.elementType as typeof FormElementType.Pages | typeof FormElementType.UsualGroup) ||
        separatedItems.includes(
          prevItem.elementType as typeof FormElementType.Pages | typeof FormElementType.UsualGroup
        ))
    ) {
      result.strings.push("")
    }

    prevItem = item

    const text = formatElement(context, item)
    result.strings.push(...text.strings)
    result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || text.haveSimpleHorizontalGroup
  }
  return result
}

export const clearFormatRegistry = (): void => {
  registry.length = 0
}
