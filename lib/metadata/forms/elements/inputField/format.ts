import * as t from "~/lib/parser/lexer"
import { type TInputField } from "./types"
import {
  IFormatterParams,
  FormatFunction,
  IFormatElementResult,
} from "~/lib/format/types"
import { isMultiline } from "./helpers"
import { formatElementName } from "~/lib/format/helpers"
import { pascalCase } from "change-case"

const UNDERLINE = t.Underscore.LABEL as string
const COLON = t.Colon.LABEL as string

export const formatInputField: FormatFunction<TInputField> = (
  element: TInputField,
  _params: IFormatterParams
): IFormatElementResult => {
  let header: string = ""

  const hasTitle = element.title?.items.ru !== undefined

  if (hasTitle) {
    header += element.title?.items.ru
  } else {
    header += element.name
  }

  header += COLON

  let value = element.value ?? ""

  header += value ? " " : ""

  const modificators = getModificators(element)
  if (modificators.length > 0) {
    value += UNDERLINE.repeat(2) + modificators
  }

  let namePart = ""
  if (
    hasTitle &&
    pascalCase(element.title?.items.ru ?? "").toLowerCase() !==
      element.name.toLowerCase()
  ) {
    namePart = " " + formatElementName(element)
  } else if (!hasTitle) {
    namePart = " " + formatElementName(element)
  }

  let result: IFormatElementResult = {
    strings: [header + value + namePart],
    haveSimpleHorizontalGroup: false,
  }

  result.strings.push(
    ...getMultilineString(element, header.length, value.length)
  )

  return result
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
