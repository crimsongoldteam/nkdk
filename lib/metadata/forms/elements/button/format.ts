import { formatGroupWrapping } from "~/lib/format/wrap/formatGroupWrapping"
import { TButton } from "./types"
import { IFormatterParams, FormatFunction } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatButton: FormatFunction<TButton> = (element: TButton, params: IFormatterParams): string[] => {
  const result = ["<" + element.title?.ru + formatElementName(element) + ">"]

  return formatGroupWrapping(result, params)
}
