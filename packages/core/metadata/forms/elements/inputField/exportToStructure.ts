import { registerFormat } from "~/format/formatFactory"
import { formatElementName } from "~/format/helpers"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import * as t from "~/parser/lexer"
import { isMultiline } from "./helpers"
import { InputField } from "./types"

const UNDERLINE = t.Underscore.LABEL as string
const COLON = t.Colon.LABEL as string

export const exportInputFieldToStructure = (
  _context: ConfigurationContext,
  element: InputField
): IFormatElementResult => {
  const hasTitle = element.title?.items.ru !== undefined

  let header = formatTitle(element, hasTitle)

  header += COLON + " "

  // let value = element.value ?? ""
  let value = ""

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

  result.strings.push(...getMultilineString(element, header.length, value.length))

  return result
}

const formatTitle = (element: InputField, hasTitle: boolean): string => {
  if (!hasTitle) return formatElementName(element)

  return element.title?.items.ru ?? ""
}

const formatNamePart = (element: InputField, hasTitle: boolean, hasValue: boolean): string => {
  if (!hasTitle) return ""

  // Добавляем пробел перед именем только если есть значение
  return (hasValue ? " " : "") + formatElementName(element)
}

function getMultilineString(element: InputField, headerLength: number, valueLength: number): string[] {
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

function getModificators(element: InputField): string {
  const propertyMap = {
    choiceButton: "В",
    dropListButton: "С",
    clearButton: "Х",
    openButton: "О",
    spinButton: "Д",
  }

  return Object.entries(propertyMap)
    .filter(([key, _]) => element[key as keyof InputField] !== undefined)
    .map(([_, value]) => value)
    .join("")
}

registerFormat<InputField>(
  exportInputFieldToStructure,
  (element: InputField) => element.elementType === FormElementType.InputField
)
registerIsOneLineElementCheck<InputField>(FormElementType.InputField, (element: InputField) => !isMultiline(element))
