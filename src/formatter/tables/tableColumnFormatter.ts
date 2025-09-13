import { TableColumnElement } from "@/elements/tableColumnElement"
import * as t from "../../parser/lexer"
import { PropertiesFormatter } from "../propertiesFormatter"
import { BaseFormatter } from "../baseFormatter"
import { FormatterFactory } from "../formatterFactory"
import { BaseElementMatcherStrategy } from "../matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { TableColumnGroupElement } from "@/elements/tableColumnGroupElement"

export class TableColumnFormatter extends BaseFormatter<TableColumnElement> {
  private readonly groupSymbol = t.Dash.LABEL

  public format(element: TableColumnElement): string[] {
    const excludeProperties = ["Заголовок"]

    let horizontalPosition = element.properties.get("ГоризонтальноеПоложение") ?? "Лево"

    if (horizontalPosition === "Лево" || element.items.length === 0) {
      excludeProperties.push("ГоризонтальноеПоложение")
    }

    let description = element.properties.get("Заголовок") ?? ""

    if (element.type === "ГруппаКолонокТаблицы") {
      description = `${this.groupSymbol} ${description} ${this.groupSymbol}`
    }

    const properties = PropertiesFormatter.render(element, { excludeProperties })
    description += properties.join("")

    description = ` ${description} `

    return [description]
  }
}

FormatterFactory.register(
  new TableColumnFormatter(new BaseElementMatcherStrategy(TableColumnElement), new ConditionWrapInGroupStrategy())
)

FormatterFactory.register(
  new TableColumnFormatter(new BaseElementMatcherStrategy(TableColumnGroupElement), new ConditionWrapInGroupStrategy())
)
