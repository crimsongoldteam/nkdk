import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn, FormElementType } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { LabelField } from "./types"

const TILDE = "~"

export const exportLabelFieldContentToStructure = (
  _context: ConfigurationContext,
  element: LabelField
): IFormatElementResult => {
  const resultString = TILDE + formatElementName(element)

  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
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
