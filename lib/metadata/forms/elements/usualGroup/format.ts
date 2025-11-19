import { formatHorizontalGroup } from "./format/horizontalGroupFormat"
import { formatVerticalGroup } from "./format/verticalGroupFormat"
import { isOneLineGroup, isVerticalGroup } from "./helpers"
import { formatOneLineGroup } from "./format/oneLineGroupFormat"
import { type TUsualGroup } from "./types"
import {
  FormatElementFunction,
  IFormatElementResult,
  IFormatterParams,
} from "~/lib/format/types"

export const formatUsualGroup: FormatElementFunction<TUsualGroup> = (
  element: TUsualGroup,
  params: IFormatterParams
): IFormatElementResult => {
  if (isVerticalGroup(element)) return formatVerticalGroup(element, params)
  if (isOneLineGroup(element)) return formatOneLineGroup(element)

  return formatHorizontalGroup(element, params)
}
