import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { PictureField } from "./types"

const AT_SYMBOL = "@"

export const exportPictureFieldContentToStructure = (
  _context: ConfigurationContext,
  element: PictureField
): IFormatElementResult => {
  const resultString = AT_SYMBOL + formatElementName(element)

  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportPictureFieldToStructure = (
  _context: ConfigurationContext,
  element: PictureField
): IFormatElementResult => {
  return exportPictureFieldContentToStructure(_context, element)
}

registerMetadata(
  "ExportToStructureContent",
  "PictureField",
  exportPictureFieldContentToStructure as ExportToStructureContentFn
)
registerMetadata("ExportToStructure", "PictureField", exportPictureFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<PictureField>(CollectionFormElementType.PictureField, () => true)
