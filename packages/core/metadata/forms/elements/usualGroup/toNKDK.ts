import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { addIndentation, joinLines } from "~/nkdk/helper"
import {
  AlwaysHorizontalGroupPrefix,
  HorizontalIfPossibleGroupPrefix,
  OneLineGroupSeparator,
  VerticalGroupPrefix,
} from "~/nkdk/lexer"
import { exportChildItemsToNKDK } from "../../commonObjects/childItems/exportToStructure"
import { formatElementTitleAndName } from "../../format/helpers"
import { UsualGroup } from "./types"

export const exportUsualGroupToNKDK = (params: {
  context: ConfigurationContext
  element: UsualGroup
}): ToNKDKResult => {
  const { context, element } = params
  return formatUsualGroup(context, element)
}

export const formatUsualGroup = (context: ConfigurationContext, element: UsualGroup): ToNKDKResult => {
  const chiltItems = exportChildItemsToNKDK(context, element.childItems)

  const header = getHeader(context, element)

  if (chiltItems.toOneLineGroup) {
    return formatOneLineGroup(header, chiltItems.strings)
  }

  const indentedChildItems = addIndentation(chiltItems.strings)

  return {
    strings: [header, ...indentedChildItems],
    toOneLineGroup: false,
  }
}

function formatOneLineGroup(header: string, childItems: string[]): ToNKDKResult {
  const joinedItems = joinLines(childItems, OneLineGroupSeparator)
  const resultLine = joinLines([header, joinedItems], " ")
  return {
    strings: [resultLine],
    toOneLineGroup: false,
  }
}

const getHeader = (context: ConfigurationContext, element: UsualGroup): string => {
  const prefix = getGroupPrefix(element.group)
  return prefix + formatElementTitleAndName(context, element, true)
}

function getGroupPrefix(group: SE.ChildFormItemsGroup): string {
  switch (group) {
    case "HorizontalIfPossible":
      return HorizontalIfPossibleGroupPrefix
    case "AlwaysHorizontal":
      return AlwaysHorizontalGroupPrefix
    case "Vertical":
      return VerticalGroupPrefix
    default:
      throw new Error(`Unknown group: ${group}`)
  }
}
