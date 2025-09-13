import { GroupElement } from "@/elements"
import { BaseElementMatcherStrategy } from "./baseElementMatcherStrategy"
import { IFormatterParams } from "../interfaces"

export class VerticalGroupMatcherStrategy extends BaseElementMatcherStrategy {
  public canFormat(element: GroupElement, params: IFormatterParams): boolean {
    return super.canFormat(element, params) && element.group === "Вертикальная"
  }
}
