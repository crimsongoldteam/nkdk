import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { PictureField } from "./types"

const AT_SYMBOL = "@"

export const exportPictureFieldContentToStructure = (
  _context: ConfigurationContext,
  element: PictureField
): IFormatElementResult => {
  const resultString = AT_SYMBOL + formatElementName(element)

  return resultString
}

export const exportPictureFieldToStructure = (
  _context: ConfigurationContext,
  element: PictureField
): IFormatElementResult => {
  return exportPictureFieldContentToStructure(_context, element)
}

registerElementOperation(
  "ExportToStructureContent",
  "PictureField",
  exportPictureFieldContentToStructure as ExportToStructureContentFn
)
registerElementOperation("ExportToStructure", "PictureField", exportPictureFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<PictureField>(CollectionFormElementType.PictureField, () => true)
