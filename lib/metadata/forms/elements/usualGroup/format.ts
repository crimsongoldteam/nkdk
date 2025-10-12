import { isOneLineGroup, isVerticalGroup } from "./helpers"
import { formatOneLineGroup } from "./oneLineGroupFormat"
import { type TUsualGroup } from "./types"
import { IFormatterParams } from "~/lib/format/types"
import { formatVerticalGroup } from "./verticalGroupFormat"
import { formatHorizontalGroup } from "./horizontalGroupFormat"
import { formatElementName } from "~/lib/format/helpers"

export function formatUsualGroup(element: TUsualGroup, params: IFormatterParams): string[] {
  let result: string[] = [formatElementName(element)]
  //indentationStrategy: SimpleIndentationStrategy
  if (isVerticalGroup(element)) {
    result.push(...formatVerticalGroup(element, {}))
    return result
  }
  if (isOneLineGroup(element)) {
    result.push(...formatOneLineGroup(element))
    return result
  }

  result.push(...formatHorizontalGroup(element, params))
  return result
}
