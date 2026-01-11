import { formatElementName } from "~/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/metadata/forms/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "../baseElement/types"
import { PictureDecoration } from "./types"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

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
