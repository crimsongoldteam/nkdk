import { formatGroupWrapping } from "~/lib/format/wrap/formatGroupWrapping"
import { TNamedElement } from "./types"
import { IFormatterParams, FormatFunction } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatOtherElement: FormatFunction<TNamedElement> = (
  element: TNamedElement,
  params: IFormatterParams
): string[] => {
  const result = ["?" + element.type + " " + formatElementName(element)]

  return formatGroupWrapping(result, params)
}
