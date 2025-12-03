import { formatElementName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import * as t from "~/lib/parser/lexer"
import { isMultiline } from "./helpers"
import { type TInputField } from "./types"

const UNDERLINE = t.Underscore.LABEL as string
const COLON = t.Colon.LABEL as string

export const formatInputField: FormatElementFunction = (
  element: TInputField,
  _configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  const hasTitle = element.title?.items.ru !== undefined

  let header = formatTitle(element, hasTitle)

  header += COLON + " "

  let value = element.value ?? ""

  const modificators = getModificators(element)
  if (modificators.length > 0) {
    value += UNDERLINE.repeat(2) + modificators
  }

  // Добавляем пробел перед именем только если есть значение или модификаторы
  const hasValue = value.length > 0 || modificators.length > 0
  let namePart = formatNamePart(element, hasTitle, hasValue)

  let result: IFormatElementResult = {
    strings: [header + value + namePart],
    haveSimpleHorizontalGroup: false,
  }

  result.strings.push(
    ...getMultilineString(element, header.length, value.length)
  )

  return result
}

const formatTitle = (element: TInputField, hasTitle: boolean): string => {
  if (!hasTitle) return formatElementName(element)

  return element.title?.items.ru ?? ""
}

const formatNamePart = (
  element: TInputField,
  hasTitle: boolean,
  hasValue: boolean
): string => {
  if (!hasTitle) return ""

  // Добавляем пробел перед именем только если есть значение
  return (hasValue ? " " : "") + formatElementName(element)
}

function getMultilineString(
  element: TInputField,
  headerLength: number,
  valueLength: number
): string[] {
  if (!isMultiline(element)) {
    return []
  }

  const height = element.height!

  let multilineStringTemplate =
    " ".repeat(headerLength) + UNDERLINE.repeat(valueLength)

  const result: string[] = []

  for (let i = 0; i < height - 1; i++) {
    result.push(multilineStringTemplate)
  }

  return result
}

function getModificators(element: TInputField): string {
  const propertyMap = {
    choiceButton: "В",
    dropListButton: "С",
    clearButton: "Х",
    openButton: "О",
    spinButton: "Д",
  }

  return Object.entries(propertyMap)
    .filter(([key, _]) => element[key as keyof TInputField] !== undefined)
    .map(([_, value]) => value)
    .join("")
}
