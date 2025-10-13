import { formatGroupWrapping } from "~/lib/format/wrap/formatGroupWrapping"
import { TPictureDecoration } from "./types"
import { IFormatterParams, FormatFunction } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatPictureDecoration: FormatFunction<TPictureDecoration> = (
  element: TPictureDecoration,
  params: IFormatterParams
): string[] => {
  const result = ["@" + element.picture?.ref + " " + formatElementName(element)]

  return formatGroupWrapping(result, params)
}
