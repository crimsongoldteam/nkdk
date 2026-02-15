import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { PropertyRule } from "../calendarField/rules"
import { PictureField } from "./types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

const AT_SYMBOL = "@"

export const exportPictureFieldContentToStructure = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
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
  rule: PropertyRule<any>,
  element: PictureField
): IFormatElementResult => {
  return exportPictureFieldContentToStructure(_context, rule, element)
}

registerMetadata(
  "ExportToStructureContent",
  "PictureField",
  exportPictureFieldContentToStructure as ExportToStructureContentFn
)
registerMetadata("ExportToStructure", "PictureField", exportPictureFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<PictureField>(CollectionFormElementType.PictureField, () => true)
