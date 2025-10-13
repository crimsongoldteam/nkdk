import { formatGroupWrapping } from "~/lib/format/wrap/formatGroupWrapping"
import { TLabelDecoration } from "./types"
import { IFormatterParams, FormatFunction } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatLabelDecoration: FormatFunction<TLabelDecoration> = (
  element: TLabelDecoration,
  params: IFormatterParams
): string[] => {
  const result = [element.title?.ru + " " + formatElementName(element)]

  return formatGroupWrapping(result, params)
}
