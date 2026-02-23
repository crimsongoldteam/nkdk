import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { registerIsOneLineElementCheck } from "~/metadata/forms/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { InputField } from "./types"

// const UNDERLINE = t.Underscore.LABEL as string
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

  // const modificators = getModificators(element)
  // if (modificators.length > 0) {
  //   value += UNDERLINE.repeat(2) + modificators
  // }

  const modificators = []

  // Добавляем пробел перед именем только если есть значение или модификаторы
  const hasValue = value.length > 0 || modificators.length > 0
  let namePart = formatNamePart(element, hasTitle, hasValue)

  let result: IFormatElementResult = {
    strings: [header + value + namePart],
    haveSimpleHorizontalGroup: false,
  }

  // result.push(...getMultilineString(element, header.length, value.length))

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

// function getModificators(element: InputField): string {
//   const propertyMap = {
//     choiceButton: "В",
//     dropListButton: "С",
//     clearButton: "Х",
//     openButton: "О",
//     spinButton: "Д",
//   }

//   return Object.entries(propertyMap)
//     .filter(([key, _]) => element[key as keyof InputField] !== undefined)
//     .map(([_, value]) => value)
//     .join("")
// }

registerElementOperation("ExportToStructure", "InputField", exportInputFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck(CollectionFormElementType.InputField, () => true)
