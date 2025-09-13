import { InputFormElement } from "../elements/inputElement"
import * as t from "../parser/lexer"
import { IFormatterParams } from "./interfaces"
import { FormatterFactory } from "./formatterFactory"
import { FormatterUtils } from "./helpers/formatterUtils"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"
import { BaseFormatter } from "./baseFormatter"
import { PropertiesFormatter } from "./propertiesFormatter"
import { IInputFieldElement } from "@/meta/forms/interfaces"

export class InputFormatter extends BaseFormatter<IInputFieldElement> {
  public format(element: IInputFieldElement, _params: IFormatterParams): string[] {
    const underline = t.Underscore.LABEL as string

    let header: string = FormatterUtils.getAlignmentAtLeft(element)

    header += element.title
    header += t.Colon.LABEL + " "

    let value = element.value ? element.value.toString() : ""

    const modificators = this.getModificators(element)
    if (modificators.length > 0) {
      value += underline.repeat(2) + modificators
    }

    const properties = PropertiesFormatter.render(element)

    let result = [header + value + properties.join("") + FormatterUtils.getAlignmentAtRight(element)]

    result.push(...this.getMultilineString(element, header.length, value.length))

    return result
  }

  private isMultiline(element: IInputFieldElement): boolean {
    return element.multiLine && element.height > 1
  }

  private getMultilineString(element: IInputFieldElement, headerLength: number, valueLength: number): string[] {
    if (!this.isMultiline(element)) {
      return []
    }

    const underline = t.Underscore.LABEL as string
    const height = element.height

    let multilineStringTemplate = " ".repeat(headerLength) + underline.repeat(valueLength)

    const result: string[] = []

    for (let i = 0; i < height - 1; i++) {
      result.push(multilineStringTemplate)
    }

    return result
  }

  private getModificators(element: IInputFieldElement): string {
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
  new InputFormatter(new BaseElementMatcherStrategy(InputFormElement), new ConditionWrapInGroupStrategy())
)
