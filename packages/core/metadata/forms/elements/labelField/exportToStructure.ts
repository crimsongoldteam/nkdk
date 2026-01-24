import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn, FormElementType } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { LabelField } from "./types"

const TILDE = t.Tilde.LABEL as string
const COLON = t.Colon.LABEL as string

export const exportLabelFieldContentToStructure = (
  _context: ConfigurationContext,
  element: LabelField
): IFormatElementResult => {
  const hasTitle = element.title?.items.ru !== undefined

  let header = formatTitle(element, hasTitle)

  header = TILDE + header + COLON + " "

  let namePart = formatNamePart(element, hasTitle)

  return {
    strings: [header + namePart],
    haveSimpleHorizontalGroup: false,
  }
}

const formatTitle = (element: LabelField, hasTitle: boolean): string => {
  if (!hasTitle) return formatElementName(element)

  return element.title?.items.ru ?? ""
}

const formatNamePart = (element: LabelField, hasTitle: boolean): string => {
  if (!hasTitle) return ""

  return formatElementName(element)
}

export const exportLabelFieldToStructure = (
  _context: ConfigurationContext,
  element: LabelField
): IFormatElementResult => {
  return exportLabelFieldContentToStructure(_context, element)
}

registerMetadata(
  "ExportToStructureContent",
  "LabelField",
  exportLabelFieldContentToStructure as ExportToStructureContentFn
)
registerMetadata("ExportToStructure", "LabelField", exportLabelFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<LabelField>(FormElementType.LabelField, () => true)
