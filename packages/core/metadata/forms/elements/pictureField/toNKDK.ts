import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { PictureFieldPrefix } from "~/nkdk/terminal"
import { formatElementNameWithDataPath } from "../../format/helpers"
import { PictureField } from "./types"

export const exportPictureFieldContentToNKDK = (params: {
  context: ConfigurationContext
  element: PictureField
}): ToNKDKResult => {
  const { context, element } = params
  const resultString = PictureFieldPrefix + formatElementNameWithDataPath({ context, element })

  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}
