import { exportPictureToYAML } from "~/metadata/commonObjects/picture/toYAML"
import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
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
