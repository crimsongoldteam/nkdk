import { IFormatterParams, WrapInGroupStrategy } from "~/lib/format/types"
import { formatElements } from "~/lib/format/formatFactory"
import { ZUsualGroupBehavior, ZUsualGroupRepresentation } from "~/lib/metadata/systemEnumerations/types"
import * as t from "~/lib/parser/lexer"
import { formatElementName } from "~/lib/format/helpers"
import { TUsualGroup } from "../types"

export const formatVerticalGroup = (element: TUsualGroup, params: IFormatterParams): string[] => {
  let result: string[] = []

  if (params.wrapInGroup != WrapInGroupStrategy.None) {
    const header = getHeader(element)
    result.push(header)
  }

  result.push(...formatElements(element.childItems))

  return result
}

const getHeader = (element: TUsualGroup): string => {
  // const excludeProperties = ["Заголовок", "Поведение", "Группировка"]

  const levelDisplay = getLevelDisplay(element)
  // if (!levelDisplay.display) {
  //   excludeProperties.push("Отображение")
  // }

  let level = levelDisplay.level

  let result = (t.Hash.LABEL as string).repeat(level)

  result += element.title?.ru ?? ""

  result += " " + formatElementName(element)

  return result
}

const getLevelDisplay = (element: TUsualGroup): { level: number; display: boolean } => {
  const result: { level: number; display: boolean } = { level: 1, display: false }

  const representation = element.representation
  const behavior = element.behavior

  const levelBehavior: Map<string, number> = new Map([
    [ZUsualGroupBehavior.enum.Collapsible, 5],
    [ZUsualGroupBehavior.enum.PopUp, 6],
  ])

  if (behavior && levelBehavior.has(behavior)) {
    result.level = levelBehavior.get(behavior) ?? 1
    if (representation && representation !== ZUsualGroupRepresentation.enum.NormalSeparation) {
      result.display = true
    }
    return result
  }

  const levelRepresentation: Map<string, number> = new Map([
    [ZUsualGroupRepresentation.enum.None, 1],
    [ZUsualGroupRepresentation.enum.WeakSeparation, 2],
    [ZUsualGroupRepresentation.enum.NormalSeparation, 3],
    [ZUsualGroupRepresentation.enum.StrongSeparation, 4],
  ])

  if (representation && levelRepresentation.has(representation)) {
    result.level = levelRepresentation.get(representation) ?? 1
  }

  return result
}
