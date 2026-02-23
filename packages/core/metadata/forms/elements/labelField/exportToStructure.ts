import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { LabelField } from "./types"

const TILDE = t.Tilde.LABEL as string
const COLON = t.Colon.LABEL as string

export const exportLabelFieldToStructure = (_context: ConfigurationContext, element: LabelField): ToNKDKResult => {
  const hasTitle = element.title?.items.ru !== undefined

  let header = formatTitle(element, hasTitle)

  header = TILDE + header + COLON + " "

  let namePart = formatNamePart(element, hasTitle)

  return {
    strings: [header + namePart],
    toOneLineGroup: false,
  }
}

export const exportLabelFieldContentToStructure = (
  _context: ConfigurationContext,
  element: LabelField
): ToNKDKResult => {
  const hasTitle = element.title?.items.ru !== undefined

  let header = formatTitle(element, hasTitle)

  header = TILDE + header

  let namePart = formatNamePart(element, hasTitle)

  if (hasTitle) {
    header = header + " "
  }

  return {
    strings: [header + namePart],
    toOneLineGroup: false,
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

registerElementOperation(
  "ExportToStructureContent",
  "LabelField",
  exportLabelFieldContentToStructure as ExportToStructureContentFn
)
registerElementOperation("ExportToStructure", "LabelField", exportLabelFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<LabelField>(CollectionFormElementType.LabelField, () => true)
