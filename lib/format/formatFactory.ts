import { ConfigurationSettings } from "../metadata/configurationSettings/types"
import { formatOtherElement } from "../metadata/forms/elements/baseElement/format"
import { BaseElement } from "../metadata/forms/elements/baseElement/types"
import { TChildItems } from "../metadata/forms/elements/childItems/types"
import { FormElementType } from "../metadata/forms/elements/types"
import {
  CheckFormatFunction,
  FormatElementFunction,
  IFormatElementResult,
} from "./types"

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
  element: T,
  configurationSettings: ConfigurationSettings
): IFormatElementResult => {
  // params = { ...defaultParams, ...params }

  const formatter = registry.find((f) =>
    f.check(element)
  ) as FormatRegistry[number]
  if (!formatter)
    return formatOtherElement(
      element as unknown as BaseElement,
      configurationSettings
    )

  const result = formatter.format(element, configurationSettings)
  return result
}

export const formatElements = (
  items: TChildItems,
  configurationSettings: ConfigurationSettings
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const separatedItems: readonly (
    | typeof FormElementType.Pages
    | typeof FormElementType.UsualGroup
  )[] = [FormElementType.Pages, FormElementType.UsualGroup]

  let prevItem: BaseElement | null = null
  for (const item of items) {
    if (
      prevItem &&
      (separatedItems.includes(
        item.elementType as
          | typeof FormElementType.Pages
          | typeof FormElementType.UsualGroup
      ) ||
        separatedItems.includes(
          prevItem.elementType as
            | typeof FormElementType.Pages
            | typeof FormElementType.UsualGroup
        ))
    ) {
      result.strings.push("")
    }

    prevItem = item

    const text = formatElement(item, configurationSettings)
    result.strings.push(...text.strings)
    result.haveSimpleHorizontalGroup =
      result.haveSimpleHorizontalGroup || text.haveSimpleHorizontalGroup
  }
  return result
}

export const clearFormatRegistry = (): void => {
  registry.length = 0
}
