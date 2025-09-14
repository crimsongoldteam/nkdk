import * as t from "../parser/lexer"
import { IFormatterParams } from "./interfaces"
import { FormatterFactory } from "./formatterFactory"
import { FormatterUtils } from "./helpers/formatterUtils"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"
import { BaseFormatter } from "./baseFormatter"
import { PropertiesFormatter } from "./propertiesFormatter"
import { IInputFieldElement, IInputFieldElementProperties } from "@/meta/forms/interfaces"

export class InputFormatter extends BaseFormatter<IInputFieldElement> {
  public format(element: IInputFieldElement, _params: IFormatterParams): string[] {
    const underline = t.Underscore.LABEL as string

    let header: string = FormatterUtils.getAlignmentAtLeft(element.properties)

    header += element.properties.title
    header += t.Colon.LABEL + " "

    let value = element.properties.dataPathName ? element.properties.dataPathName.toString() : ""

    const modificators = this.getModificators(element)
    if (modificators.length > 0) {
      value += underline.repeat(2) + modificators
    }

    const properties = PropertiesFormatter.render(element.properties)

    let result = [header + value + properties.join("") + FormatterUtils.getAlignmentAtRight(element.properties)]

    result.push(...this.getMultilineString(element, header.length, value.length))

    return result
  }

  private isMultiline(element: IInputFieldElement): boolean {
    return element.properties.multiLine && element.properties.height > 1
  }

  private getMultilineString(element: IInputFieldElement, headerLength: number, valueLength: number): string[] {
    if (!this.isMultiline(element)) {
      return []
    }

    const underline = t.Underscore.LABEL as string
    const height = element.properties.height

    let multilineStringTemplate = " ".repeat(headerLength) + underline.repeat(valueLength)

    const result: string[] = []

    for (let i = 0; i < height - 1; i++) {
      result.push(multilineStringTemplate)
    }

    return result
  }

  private getModificators(element: IInputFieldElement): string {
    const propertyMap = {
      choiceButton: "В",
      dropListButton: "С",
      сlearButton: "Х",
      openButton: "О",
      spinButton: "Д",
    }

    return Object.entries(propertyMap)
      .filter(([key, _]) => element.properties[key as keyof IInputFieldElementProperties] !== undefined)
      .map(([_, value]) => value)
      .join("")
  }
}

// FormatterFactory.register(
//   new InputFormatter(new BaseElementMatcherStrategy(InputFieldElement), new ConditionWrapInGroupStrategy())
// )
