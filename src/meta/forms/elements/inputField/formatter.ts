import * as t from "../../../../parser/lexer"
import { IFormatterParams } from "../../../../formatter/interfaces"
import { FormatterFactory } from "../../../../formatter/formatterFactory"
import { FormatterUtils } from "../../../../formatter/helpers/formatterUtils"
import { BaseElementMatcherStrategy } from "../../../../formatter/matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../../../../formatter/indentation/conditionWrapInGroupStrategy"
import { BaseFormatter } from "../../../../formatter/baseFormatter"
import { PropertiesFormatter } from "../../../../formatter/propertiesFormatter"
import { IInputField, IInputFieldProperties } from "./interfaces"
import { TYPES } from "@/meta/forms/container/symbols"
import { container } from "tsyringe"
import { IDefaultsProvider } from "@/meta/forms/helpers/interfaces"

export class InputFieldFormatter extends BaseFormatter<IInputField> {
  public format(element: IInputField, _params: IFormatterParams): string[] {
    const underline = t.Underscore.LABEL as string

    let header: string = FormatterUtils.getAlignmentAtLeft(element.properties)

    header += element.properties.title
    header += t.Colon.LABEL + " "

    let value = element.value.toString()

    const modificators = this.getModificators(element)
    if (modificators.length > 0) {
      value += underline.repeat(2) + modificators
    }

    const changedProperties = container.resolve<IDefaultsProvider>(TYPES.IInputFieldDefaultsProvider).render(element)
    const renderedProperties = PropertiesFormatter.render(changedProperties)

    let result = [header + value + renderedProperties.join("") + FormatterUtils.getAlignmentAtRight(element.properties)]

    result.push(...this.getMultilineString(element, header.length, value.length))

    return result
  }

  private isMultiline(element: IInputField): boolean {
    return element.properties.multiLine && element.properties.height > 1
  }

  private getMultilineString(element: IInputField, headerLength: number, valueLength: number): string[] {
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

  private getModificators(element: IInputField): string {
    const propertyMap = {
      choiceButton: "В",
      dropListButton: "С",
      сlearButton: "Х",
      openButton: "О",
      spinButton: "Д",
    }

    return Object.entries(propertyMap)
      .filter(([key, _]) => element.properties[key as keyof IInputFieldProperties] !== undefined)
      .map(([_, value]) => value)
      .join("")
  }
}

// FormatterFactory.register(
//   new InputFormatter(new BaseElementMatcherStrategy(InputFieldElement), new ConditionWrapInGroupStrategy())
// )
