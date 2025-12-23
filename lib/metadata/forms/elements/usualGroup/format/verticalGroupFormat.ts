import { formatElements } from "~/lib/format/formatFactory"
import { formatElementTitleAndName } from "~/lib/format/helpers"
import { IFormatElementResult } from "~/lib/format/types"
import { Context } from "~/lib/metadata/context/types"
import { UsualGroupBehavior, UsualGroupRepresentation } from "~/lib/metadata/systemEnumerations/types"
import * as t from "~/lib/parser/lexer"
import { UsualGroup } from "../types"

export const formatVerticalGroup = (element: UsualGroup, context: Context): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }
  const childItems = element.childItems ?? []

  // if (params.wrapInGroup != WrapInGroupStrategy.None) {
  const header = getHeader(element)
  result.strings.push(header)
  // }

  const lines = formatElements(childItems, context)

  for (const line of lines.strings) {
    result.strings.push("  " + line)
    result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || lines.haveSimpleHorizontalGroup
  }

  // result.push(...formatElements(element.childItems))

  // const trimmedResult = result.map((line) => line.trim())

  // return formatCommonWrapping(trimmedResult, params)

  return result
}

const getHeader = (element: UsualGroup): string => {
  // const excludeProperties = ["Заголовок", "Поведение", "Группировка"]

  const levelDisplay = getLevelDisplay(element)
  // if (!levelDisplay.display) {
  //   excludeProperties.push("Отображение")
  // }

  let level = levelDisplay.level

  let result = (t.Hash.LABEL as string).repeat(level)

  result += formatElementTitleAndName(element)

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
