import * as t from "~/lib/metadata/forms/parser/lexer"
import { type TInputField } from "~/lib/metadata/forms/elements/inputField/types"
import { IFormatterParams } from "~/lib/formatter/types"
import { isMultiline } from "./helpers"

const UNDERLINE = t.Underscore.LABEL as string
const COLON = t.Colon.LABEL as string

export function formatInputField(element: TInputField, _params: IFormatterParams): string[] {
  let header: string = element.title?.ru ?? ""
  header += COLON + " "

  let value = element.value ?? ""

  const modificators = getModificators(element)
  if (modificators.length > 0) {
    value += UNDERLINE.repeat(2) + modificators
  }

  let result = [header + value]

  result.push(...getMultilineString(element, header.length, value.length))

  return result
}

function getMultilineString(element: TInputField, headerLength: number, valueLength: number): string[] {
  if (!isMultiline(element)) {
    return []
  }

  const height = element.height!

  let multilineStringTemplate = " ".repeat(headerLength) + UNDERLINE.repeat(valueLength)

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
