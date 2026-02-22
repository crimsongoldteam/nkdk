import { exportPictureToYAML } from "~/metadata/commonObjects/picture/toYAML"
import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerIsOneLineElementCheck } from "~/metadata/forms/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { formatElementTitleAndName } from "../../format/helpers"
import { PictureDecoration } from "./types"

export const exportPictureDecorationToStructure = (
  context: ConfigurationContext,
  element: PictureDecoration
): IFormatElementResult => {
  const picture: PictureYAML | undefined = exportPictureToYAML(context, undefined, element.picture)

  const pictureString = typeof picture === "string" ? picture : ""

  const result: IFormatElementResult = {
    strings: ["@" + (pictureString ? pictureString + " " : "") + formatElementTitleAndName(context, element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerIsOneLineElementCheck<PictureDecoration>(CollectionFormElementType.PictureDecoration, () => true)
registerElementOperation(
  "ExportToStructure",
  "PictureDecoration",
  exportPictureDecorationToStructure as ExportToStructureFn
)
