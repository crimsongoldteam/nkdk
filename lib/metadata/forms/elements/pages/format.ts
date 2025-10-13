import { TPages } from "./types"
import { FormatFunction, IFormatterParams } from "~/lib/format/types"
import { TPage } from "../page/types"
import { formatPage } from "../page/format"
import { formatGroupWrapping } from "~/lib/format/wrap/formatGroupWrapping"

export const formatPages: FormatFunction<TPages> = (element: TPages, params: IFormatterParams): string[] => {
  const result = element.childItems.flatMap((item: TPage) => formatPage(item, params))
  return formatGroupWrapping(result, params)
}
