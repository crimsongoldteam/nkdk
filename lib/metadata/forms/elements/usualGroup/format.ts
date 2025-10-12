import { formatHorizontalGroup } from "./format/horizontalGroupFormat"
import { formatVerticalGroup } from "./format/verticalGroupFormat"
import { isOneLineGroup, isVerticalGroup } from "./helpers"
import { formatOneLineGroup } from "./format/oneLineGroupFormat"
import { type TUsualGroup } from "./types"
import { IFormatterParams } from "~/lib/format/types"

export function formatUsualGroup(element: TUsualGroup, params: IFormatterParams): string[] {
  //indentationStrategy: SimpleIndentationStrategy
  if (isVerticalGroup(element)) return formatVerticalGroup(element, {})
  if (isOneLineGroup(element)) return formatOneLineGroup(element)

  return formatHorizontalGroup(element, params)
}
