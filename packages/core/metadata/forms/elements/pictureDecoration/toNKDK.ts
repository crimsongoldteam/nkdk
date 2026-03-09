import { exportPictureToYAML } from "~/metadata/commonObjects/picture/toYAML"
import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { formatElementName } from "../../format/helpers"
import { PictureDecoration } from "./types"

export const exportPictureDecorationToNKDK = (params: {
  context: ConfigurationContext
  element: PictureDecoration
}): ToNKDKResult => {
  const { context, element } = params
  const picture: PictureYAML | undefined = exportPictureToYAML(context, undefined, element.picture)

  const pictureString = typeof picture === "string" ? picture : ""

  const result: ToNKDKResult = {
    strings: ["!" + (pictureString ? "[" + pictureString + "] " : "") + formatElementName(element)],
    toOneLineGroup: true,
  }

  return result
}
