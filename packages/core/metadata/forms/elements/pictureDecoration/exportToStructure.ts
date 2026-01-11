import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { PictureDecoration } from "./types"

export const exportPictureDecorationToStructure: FormatElementFunction = (
  _context: ConfigurationContext,
  element: BaseElement
): IFormatElementResult => {
  const pictureDecoration = element as PictureDecoration
  const result: IFormatElementResult = {
    strings: ["@" + pictureDecoration.picture?.ref + " " + formatElementName(pictureDecoration)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerIsOneLineElementCheck<PictureDecoration>(FormElementType.PictureDecoration, () => true)
registerMetadata("ExportToStructure", "PictureDecoration", exportPictureDecorationToStructure)
