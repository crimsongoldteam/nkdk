import { ConfigurationContext } from "~/metadata/context/types"
import { registerIsOneLineElementCheck } from "~/metadata/forms/format/isOneLineElementCheckFactory"
import { FormatElementFunction, IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn, FormElementType } from "../../../metadataFactory/types"
import { formatElementTitleAndName } from "../../format/helpers"
import { NamedElement } from "../baseElement/types"
import { PictureDecoration } from "./types"

export const exportPictureDecorationToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  element: NamedElement
): IFormatElementResult => {
  const pictureDecoration = element as PictureDecoration
  const result: IFormatElementResult = {
    strings: ["@" + pictureDecoration.picture?.ref + " " + formatElementTitleAndName(context, pictureDecoration)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerIsOneLineElementCheck<PictureDecoration>(FormElementType.PictureDecoration, () => true)
registerMetadata("ExportToStructure", "PictureDecoration", exportPictureDecorationToStructure as ExportToStructureFn)
