import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToStructure } from "~/metadata/forms/commonObjects/childItems/exportToStructure"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { UsualGroupBehavior, UsualGroupRepresentation } from "~/metadata/systemEnumerations/types"
import { UsualGroup } from "../types"

export const formatVerticalGroup = (context: ConfigurationContext, element: UsualGroup): ToNKDKResult => {
  let result: ToNKDKResult = {
    strings: [],
    toOneLineGroup: false,
  }
  const childItems = element.childItems ?? []

  // if (params.wrapInGroup != WrapInGroupStrategy.None) {
  const header = getHeader(context, element)
  result.strings.push(header)
  // }

  const lines = exportChildItemsToStructure(context, childItems)

  for (const line of lines.strings) {
    result.strings.push("  " + line)
    result.toOneLineGroup = result.toOneLineGroup || lines.toOneLineGroup
  }

  // result.push(...formatElements(element.childItems))

  // const trimmedResult = result.map((line) => line.trim())

  // return formatCommonWrapping(trimmedResult, params)

  return result
}

const getHeader = (context: ConfigurationContext, element: UsualGroup): string => {
  // const excludeProperties = ["Заголовок", "Поведение", "Группировка"]

  const levelDisplay = getLevelDisplay(element)
  // if (!levelDisplay.display) {
  //   excludeProperties.push("Отображение")
  // }

  let level = levelDisplay.level

  let result = (t.Hash.LABEL as string).repeat(level)

  result += formatElementTitleAndName(context, element)

  return result
}

const getLevelDisplay = (element: UsualGroup): { level: number; display: boolean } => {
  const result: { level: number; display: boolean } = {
    level: 1,
    display: false,
  }

  const representation = element.representation
  const behavior = element.behavior

  const levelBehavior: Map<UsualGroupBehavior, number> = new Map([
    ["Collapsible", 5],
    ["PopUp", 6],
  ])

  if (behavior && levelBehavior.has(behavior)) {
    result.level = levelBehavior.get(behavior) ?? 1
    if (representation && representation !== "NormalSeparation") {
      result.display = true
    }
    return result
  }

  const levelRepresentation: Map<UsualGroupRepresentation, number> = new Map([
    ["None", 1],
    ["WeakSeparation", 2],
    ["NormalSeparation", 3],
    ["StrongSeparation", 4],
  ])

  if (representation && levelRepresentation.has(representation)) {
    result.level = levelRepresentation.get(representation) ?? 1
  }

  return result
}
