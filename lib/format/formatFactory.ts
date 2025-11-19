import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import {
  CheckFormatFunction,
  FormatElementFunction,
  IFormatElementResult,
  WrapInGroupStrategy,
} from "./types"
import { formatOtherElement } from "../metadata/forms/elements/baseElement/format"
import { ZElementType } from "../metadata/forms/elements/types"
import { TConfigurationSettings } from "../metadata/configurationSettings/types"
import { TChildItems } from "../metadata/forms/elements/childItems/types"

type FormatRegistry = {
  format: FormatElementFunction
  check: CheckFormatFunction<TBaseElement>
}[]

const registry: FormatRegistry = []

export const registerFormat = <T extends TBaseElement>(
  format: FormatElementFunction,
  check: CheckFormatFunction<T>
): void => {
  registry.push({
    format: format,
    check: check as CheckFormatFunction<TBaseElement>,
  })
}

export const formatElement = <T extends TBaseElement>(
  element: T,
  configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  // params = { ...defaultParams, ...params }

  const formatter = registry.find((f) =>
    f.check(element)
  ) as FormatRegistry[number]
  if (!formatter)
    return formatOtherElement(
      element as unknown as TBaseElement,
      configurationSettings
    )

  const result = formatter.format(element, configurationSettings)
  return result
}

export const formatElements = (
  items: TChildItems,
  configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const separatedItems: readonly (
    | typeof ZElementType.enum.Pages
    | typeof ZElementType.enum.UsualGroup
  )[] = [ZElementType.enum.Pages, ZElementType.enum.UsualGroup]

  let prevItem: TBaseElement | null = null
  for (const item of items) {
    if (
      prevItem &&
      (separatedItems.includes(
        item.elementType as
          | typeof ZElementType.enum.Pages
          | typeof ZElementType.enum.UsualGroup
      ) ||
        separatedItems.includes(
          prevItem.elementType as
            | typeof ZElementType.enum.Pages
            | typeof ZElementType.enum.UsualGroup
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
