import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { PictureFieldPrefix } from "~/nkdk/terminal"
import { PictureField } from "./types"

export const exportPictureFieldContentToNKDK = (params: {
  context: ConfigurationContext
  element: PictureField
}): ToNKDKResult => {
  const { context, element } = params
  const resultString = PictureFieldPrefix + formatElementTitleAndName(context, element)

  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}
