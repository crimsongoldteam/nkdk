import * as t from "@/metadata/forms/parser/lexer"
import { injectable, singleton } from "tsyringe"
import { IFormatter, IFormatterParams } from "../../interfaces"
import { IInputField, IInputFieldProperties } from "./interfaces"
import { DITokens } from "@/symbols"

@singleton()
@injectable({ token: DITokens.InputField.Formatter })
export class InputFieldFormatter implements IFormatter {
  private readonly UNDERLINE = t.Underscore.LABEL as string
  private readonly COLON = t.Colon.LABEL as string

  public render(element: IInputField, _params: IFormatterParams): string[] {
    let header: string = element.properties.title ?? ""
    header += this.COLON + " "

    let value = element.value.toString()

    const modificators = this.getModificators(element)
    if (modificators.length > 0) {
      value += this.UNDERLINE.repeat(2) + modificators
    }

    let result = [header + value]

    result.push(...this.getMultilineString(element, header.length, value.length))

    return result
  }

  private getMultilineString(element: IInputField, headerLength: number, valueLength: number): string[] {
    if (!element.isMultiline()) {
      return []
    }

    const height = element.properties.height!

    let multilineStringTemplate = " ".repeat(headerLength) + this.UNDERLINE.repeat(valueLength)

    const result: string[] = []

    for (let i = 0; i < height - 1; i++) {
      result.push(multilineStringTemplate)
    }

    return result
  }

  //   public format(element: IInputField, _params: IFormatterParams): string[] {
  //     const underline = t.Underscore.LABEL as string

  //     let header: string = FormatterUtils.getAlignmentAtLeft(element.properties)

  //     header += element.properties.title
  //     header += t.Colon.LABEL + " "

  //     let value = element.value.toString()

  //     const modificators = this.getModificators(element)
  //     if (modificators.length > 0) {
  //       value += underline.repeat(2) + modificators
  //     }

  //     const changedProperties = container.resolve<IDefaultsProvider>(TYPES.IInputFieldDefaultsProvider).render(element)
  //     const renderedProperties = PropertiesFormatter.render(changedProperties)

  //     let result = [header + value + renderedProperties.join("") + FormatterUtils.getAlignmentAtRight(element.properties)]

  //     result.push(...this.getMultilineString(element, header.length, value.length))

  //     return result
  //   }

  private getModificators(element: IInputField): string {
    const propertyMap = {
      choiceButton: "В",
      dropListButton: "С",
      clearButton: "Х",
      openButton: "О",
      spinButton: "Д",
    }

    return Object.entries(propertyMap)
      .filter(([key, _]) => element.properties[key as keyof IInputFieldProperties] !== undefined)
      .map(([_, value]) => value)
      .join("")
  }
}
