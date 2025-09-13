import { IBaseElement } from "@/elements/interfaces"
import { IElementMatcherStrategy, IFormatterParams } from "../interfaces"

export class BaseElementMatcherStrategy implements IElementMatcherStrategy {
  private readonly ctor: new (...args: any[]) => any

  constructor(ctor: new (...args: any[]) => any) {
    this.ctor = ctor
  }

  public canFormat(element: IBaseElement, _params: IFormatterParams): boolean {
    return element instanceof this.ctor
  }
}
