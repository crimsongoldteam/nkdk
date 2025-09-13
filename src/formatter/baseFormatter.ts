import { IElementMatcherStrategy, IFormatter, IFormatterParams, IWrapInGroupStrategy } from "./interfaces"
import { IBaseElement } from "@/elements/interfaces"

export abstract class BaseFormatter<T extends IBaseElement> implements IFormatter<T> {
  private readonly matcherStrategy: IElementMatcherStrategy
  private readonly indentationStrategy: IWrapInGroupStrategy

  constructor(matcherStrategy: IElementMatcherStrategy, indentationStrategy: IWrapInGroupStrategy) {
    this.matcherStrategy = matcherStrategy
    this.indentationStrategy = indentationStrategy
  }

  public abstract format(element: T, params: IFormatterParams): string[]

  public canRender(element: IBaseElement, params: IFormatterParams): boolean {
    return this.matcherStrategy.canFormat(element, params)
  }

  public render(element: T, params: IFormatterParams): string[] {
    const result = this.format(element, params)
    return this.indentationStrategy.format(result, params)
  }
}
