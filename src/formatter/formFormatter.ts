import { FormElement } from "../elements/index"
import trimEnd from "@ungap/trim-end"
import * as t from "../parser/lexer"
import { FormatterFactory } from "./formatterFactory"
import { IFormatterParams } from "./interfaces"
import { BaseFormatter } from "./baseFormatter"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { PropertiesFormatter } from "./propertiesFormatter"

export class FormFormatter extends BaseFormatter<FormElement> {
  public format(element: FormElement, _params: IFormatterParams): string[] {
    const result: string[] = []

    let header = element.properties.get("Заголовок")

    const properties = PropertiesFormatter.render(element, {
      excludeProperties: ["Заголовок"],
    }).join("")

    if (header || properties) {
      const dashes = (t.Dashes.LABEL as string).repeat(3)
      header = dashes + " " + header + " " + dashes + properties
      result.push(header)
    }

    result.push(...FormatterFactory.renderItems(element.items))

    result.forEach((item, index) => {
      result[index] = trimEnd.call(item, "")
    })

    return result
  }
}

FormatterFactory.register(
  new FormFormatter(new BaseElementMatcherStrategy(FormElement), new ConditionWrapInGroupStrategy())
)
