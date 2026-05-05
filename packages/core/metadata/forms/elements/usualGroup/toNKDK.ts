import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { addIndentation, joinLines } from "~/nkdk/helper"
import {
  AlwaysHorizontalGroupPrefix,
  HorizontalIfPossibleGroupPrefix,
  OneLineGroupSeparator,
  VerticalGroupPrefix,
} from "~/nkdk/terminal"
import { exportChildItemsToNKDK } from "../../commonObjects/childItems/toNKDK"
import { formatElementName, formatElementTitleAndName } from "../../format/helpers"
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

  if (isOneLineGroup(element, chiltItems)) {
    return formatOneLineGroup(header, chiltItems.strings)
  }

  const indentedChildItems = addIndentation(chiltItems.strings)

  return {
    strings: [header, ...indentedChildItems],
    toOneLineGroup: false,
  }
}

const isOneLineGroup = (element: UsualGroup, childItems: ToNKDKResult): boolean => {
  return element.group !== "Vertical" && childItems.toOneLineGroup
}

function formatOneLineGroup(header: string, childItems: string[]): ToNKDKResult {
  const joinedItems = joinLines(childItems, OneLineGroupSeparator)
  const resultLine = joinLines([header, joinedItems], " ").trim()
  return {
    strings: [resultLine],
    toOneLineGroup: false,
  }
}

// Правила отображения заголовков
// Если установлено показывать заголовок, то отображаем заголовок даже если он пустой
// Если установлено не показывать заголовок, то не отображаем заголовок, а передаем его в YAML

const getHeader = (context: ConfigurationContext, element: UsualGroup): string => {
  const prefix = getGroupPrefix(element.group)

  const title = element.showTitle ? formatElementTitleAndName(context, element, true) : formatElementName(element)

  return prefix + title
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
