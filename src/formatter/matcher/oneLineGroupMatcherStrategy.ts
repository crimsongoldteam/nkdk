import { GroupElement } from "@/elements"
import { IFormatterParams } from "../interfaces"
import { BaseElementMatcherStrategy } from "./baseElementMatcherStrategy"

export class OneLineGroupMatcherStrategy extends BaseElementMatcherStrategy {
  public canFormat(element: GroupElement, params: IFormatterParams): boolean {
    return super.canFormat(element, params) && element.group === "Горизонтальная" && element.isOneLineGroup()
  }
}
