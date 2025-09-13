import { IFormatter, IFormatterParams, WrapInGroupStrategy } from "./interfaces"
import { IBaseElement } from "@/elements/interfaces"
import { SeparatorsMap } from "./separatorsMap"

export class FormatterFactory {
  private static readonly formatters = new Array<IFormatter<IBaseElement>>()
  private static readonly defaultParams = { wrapInGroup: WrapInGroupStrategy.Auto, level: 0, isFirst: true }

  public static register(formatter: IFormatter<IBaseElement>): void {
    this.formatters.push(formatter)
  }

  public static render(element: IBaseElement, params: IFormatterParams = this.defaultParams): string[] {
    params = { ...this.defaultParams, ...params }

    const currentFormatter = this.getFormatter(element, params)
    const result = currentFormatter.render(element, params)
    return result
  }

  public static renderItems(items: IBaseElement[]): string[] {
    const result: string[] = []

    const indent = ""
    let previousItem: IBaseElement | undefined = undefined
    for (const item of items) {
      if (SeparatorsMap.isNeedSeparator(item, previousItem)) {
        result.push(indent)
      }

      const text = FormatterFactory.render(item, this.defaultParams)
      result.push(...text)

      previousItem = item
    }
    return result
  }

  private static getFormatter(element: IBaseElement, params: IFormatterParams): IFormatter<IBaseElement> {
    for (const formatter of this.formatters) {
      if (formatter.canRender(element, params)) {
        return formatter
      }
    }
    throw new Error(`Formatter for ${element.constructor.name} not found`)
  }
}
