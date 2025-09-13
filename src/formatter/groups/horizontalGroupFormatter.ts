import { GroupElement } from "@/elements"
import { IFormatterParams, WrapInGroupStrategy } from "../interfaces"
import { FormatterFactory } from "../formatterFactory"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { BaseFormatter } from "../baseFormatter"
import { HorizontalGroupMatcherStrategy } from "../matcher/horizontalGroupMatcherStrategy"
import { PropertiesFormatter } from "../propertiesFormatter"
import * as t from "../../parser/lexer"

export class HorizontalGroupFormatter extends BaseFormatter<GroupElement> {
  private readonly FIRST_LINE_SEPARATOR = " " + (t.Hash.LABEL as string)
  private readonly SEPARATOR = " " + (t.Plus.LABEL as string)

  public format(element: GroupElement, _params: IFormatterParams): string[] {
    const excludeProperties = ["Группировка"]
    const properties = PropertiesFormatter.renderInineProperties(element, { excludeProperties })

    let result: string[] = []
    result.push(...properties)

    let verticalGroups: string[][] = this.getVerticalItems(element)
    let rows = this.mergeHorizontally(this.FIRST_LINE_SEPARATOR, this.SEPARATOR, ...verticalGroups)
    result.push(...rows)

    return result
  }

  private getVerticalItems(element: GroupElement): string[][] {
    let result: string[][] = []
    let isFirst = true
    for (const item of element.items) {
      const formattedItem = FormatterFactory.render(item, {
        isFirst: isFirst,
        level: 0,
        wrapInGroup: WrapInGroupStrategy.Always,
      })
      result.push(formattedItem)
      isFirst = false
    }
    return result
  }

  private mergeHorizontally(firstLineSeparator: string, separator: string, ...arrays: string[][]): string[] {
    const maxLength = Math.max(...arrays.map((arr) => arr.length))

    const arrayWidths = arrays.map((arr) => (arr.length > 0 ? arr[0].length : 0))

    const result: string[] = []

    for (let rowIndex = 0; rowIndex < maxLength; rowIndex++) {
      let mergedRow = ""
      const currentSeparator = rowIndex == 0 ? firstLineSeparator : separator

      for (let colIndex = 0; colIndex < arrays.length; colIndex++) {
        if (colIndex > 0) {
          mergedRow += currentSeparator
        }

        const cell = rowIndex < arrays[colIndex].length ? arrays[colIndex][rowIndex] : " ".repeat(arrayWidths[colIndex])

        mergedRow += cell
      }

      result.push(mergedRow)
    }

    return result
  }
}

FormatterFactory.register(
  new HorizontalGroupFormatter(new HorizontalGroupMatcherStrategy(GroupElement), new ConditionWrapInGroupStrategy())
)
