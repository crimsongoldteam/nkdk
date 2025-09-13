import * as t from "../../parser/lexer"
import { GroupElement } from "@/elements"
import { BaseFormatter } from "../baseFormatter"
import { FormatterFactory } from "../formatterFactory"
import { IFormatterParams, WrapInGroupStrategy } from "../interfaces"
import { OneLineGroupMatcherStrategy } from "../matcher/oneLineGroupMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { PropertiesFormatter } from "../propertiesFormatter"

export class OneLineGroupFormatter extends BaseFormatter<GroupElement> {
  public format(element: GroupElement, _params: IFormatterParams): string[] {
    const separatorSymbol = t.Ampersand.LABEL as string
    const separator = " " + separatorSymbol + " "

    const excludeProperties = ["Группировка"]
    const properties = PropertiesFormatter.renderInineProperties(element, { excludeProperties })

    let result: string[] = []
    result.push(...properties)

    if (element.items.length === 0) {
      //&
      result.push(separatorSymbol)
      return result
    }

    let groupItems: string[][] = []

    let isFirst = true
    for (const item of element.items) {
      groupItems.push(
        FormatterFactory.render(item, { isFirst: isFirst, wrapInGroup: WrapInGroupStrategy.Auto, level: 0 })
      )
      isFirst = false
    }

    let resultLine = groupItems.join(separator)

    if (element.items.length === 1) {
      //Element &
      resultLine += " " + separatorSymbol
    }

    result.push(resultLine)

    return result
  }
}

FormatterFactory.register(
  new OneLineGroupFormatter(new OneLineGroupMatcherStrategy(GroupElement), new ConditionWrapInGroupStrategy())
)
