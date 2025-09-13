import { InputElement } from "../elements/inputElement"
import * as t from "../parser/lexer"
import { IFormatterParams } from "./interfaces"
import { FormatterFactory } from "./formatterFactory"
import { FormatterUtils } from "./helpers/formatterUtils"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"
import { BaseFormatter } from "./baseFormatter"
import { PropertiesFormatter } from "./propertiesFormatter"

export class InputFormatter extends BaseFormatter<InputElement> {
  public format(element: InputElement, _params: IFormatterParams): string[] {
    const underline = t.Underscore.LABEL as string

    let header: string = FormatterUtils.getAlignmentAtLeft(element)

    header += element.properties.get("Заголовок") ?? ""
    header += t.Colon.LABEL + " "

    let value = ""
    if (element.value) {
      value = element.value
    }

    const modificators = this.getModificators(element)
    if (modificators.length > 0) {
      value += underline.repeat(2) + modificators
    }

    let excludeProperties = [
      "КнопкаВыпадающегоСписка",
      "КнопкаВыбора",
      "КнопкаОчистки",
      "КнопкаРегулирования",
      "КнопкаОткрытия",
      "ГоризонтальноеПоложениеВГруппе",
      "Заголовок",
    ]

    FormatterUtils.excludeStretchProperties(excludeProperties, element)

    if (this.isMultiline(element)) {
      excludeProperties.push("Высота")
      excludeProperties.push("МногострочныйРежим")
    }

    const properties = PropertiesFormatter.render(element, {
      excludeProperties: excludeProperties,
    })

    let result = [header + value + properties.join("") + FormatterUtils.getAlignmentAtRight(element)]

    result.push(...this.getMultilineString(element, header.length, value.length))

    return result
  }

  private isMultiline(element: InputElement): boolean {
    return element.isMultiline()
  }

  private getMultilineString(element: InputElement, headerLength: number, valueLength: number): string[] {
    if (!this.isMultiline(element)) {
      return []
    }

    const underline = t.Underscore.LABEL as string
    const height = element.getProperty("Высота") as number

    let multilineStringTemplate = " ".repeat(headerLength) + underline.repeat(valueLength)

    const result: string[] = []

    for (let i = 0; i < height - 1; i++) {
      result.push(multilineStringTemplate)
    }

    return result
  }

  private getModificators(element: InputElement): string {
    const propertyMap: { [key: string]: string } = {
      КнопкаВыбора: "В",
      КнопкаВыпадающегоСписка: "С",
      КнопкаОчистки: "Х",
      КнопкаОткрытия: "О",
      КнопкаРегулирования: "Д",
    }

    return Object.keys(propertyMap)
      .filter((key) => element.properties.get(key) !== undefined)
      .map((key) => propertyMap[key])
      .join("")
  }
}

FormatterFactory.register(
  new InputFormatter(new BaseElementMatcherStrategy(InputElement), new ConditionWrapInGroupStrategy())
)
